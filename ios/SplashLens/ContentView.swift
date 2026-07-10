import SwiftUI
import StoreKit
import WebKit

struct ContentView: View {
    var body: some View {
        SplashLensWebView()
            .ignoresSafeArea(edges: .bottom)
            .background(Color(red: 0.02, green: 0.07, blue: 0.09))
    }
}

struct SplashLensWebView: UIViewRepresentable {
    private let storeURL = URL(string: "https://app.splashlens.com/?store=ios")!

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.allowsInlineMediaPlayback = true
        configuration.userContentController.add(context.coordinator, name: "splashlensNativeBilling")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        context.coordinator.attach(webView)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.02, green: 0.07, blue: 0.09, alpha: 1)
        webView.load(URLRequest(url: storeURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(storeURL: storeURL)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        private let allowedHosts: Set<String> = ["app.splashlens.com", "splashlens.com", "www.splashlens.com"]
        private let productIds = ["partsnap_pro_monthly", "partsnap_pro_annual"]
        private let storeURL: URL
        private weak var webView: WKWebView?

        init(storeURL: URL) {
            self.storeURL = storeURL
        }

        func attach(_ webView: WKWebView) {
            self.webView = webView
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "splashlensNativeBilling" else { return }
            let payload = message.body as? [String: Any]
            let action = payload?["action"] as? String ?? "purchase"
            let productId = payload?["productId"] as? String ?? "partsnap_pro_monthly"
            Task { @MainActor in
                if action == "restore" {
                    await restorePurchases()
                } else {
                    await purchase(productId: productId)
                }
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if url.scheme == "mailto" || url.scheme == "tel" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }

            if url.host == "app.splashlens.com", url.query?.contains("store=ios") != true {
                var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
                var items = components?.queryItems ?? []
                items.append(URLQueryItem(name: "store", value: "ios"))
                components?.queryItems = items
                if let adjusted = components?.url {
                    webView.load(URLRequest(url: adjusted))
                    decisionHandler(.cancel)
                    return
                }
            }

            decisionHandler(allowedHosts.contains(url.host ?? "") ? .allow : .cancel)
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            webView.load(URLRequest(url: storeURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
        }

        @MainActor
        private func purchase(productId: String) async {
            guard productIds.contains(productId) else {
                showNativeBillingMessage("That SplashLens product is not configured yet.")
                return
            }

            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    showNativeBillingMessage("PartSnap Pro is not live in App Store Connect yet.")
                    return
                }

                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        showNativeBillingMessage("Apple could not verify that purchase on device.")
                        return
                    }
                    await activate(
                        transaction: transaction,
                        productId: productId,
                        signedTransactionInfo: verification.jwsRepresentation
                    )
                    await transaction.finish()
                case .userCancelled:
                    showNativeBillingMessage("Purchase cancelled.")
                case .pending:
                    showNativeBillingMessage("Purchase is pending approval from Apple.")
                @unknown default:
                    showNativeBillingMessage("Apple returned an unknown purchase state.")
                }
            } catch {
                showNativeBillingMessage("PartSnap Pro purchase could not start yet.")
            }
        }

        @MainActor
        private func restorePurchases() async {
            var restored = false
            for await result in StoreKit.Transaction.currentEntitlements {
                guard case .verified(let transaction) = result,
                      productIds.contains(transaction.productID) else { continue }
                restored = true
                await activate(
                    transaction: transaction,
                    productId: transaction.productID,
                    signedTransactionInfo: result.jwsRepresentation
                )
            }
            if !restored {
                showNativeBillingMessage("No active PartSnap Pro subscription was found.")
            }
        }

        @MainActor
        private func activate(transaction: StoreKit.Transaction, productId: String, signedTransactionInfo: String) async {
            guard let url = URL(string: "https://app.splashlens.com/api/native-entitlement") else { return }
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try? JSONSerialization.data(withJSONObject: [
                "store": "ios",
                "productId": productId,
                "signedTransactionInfo": signedTransactionInfo,
                "transactionId": String(transaction.id),
                "originalTransactionId": String(transaction.originalID)
            ])

            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                      let payload = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let activateUrl = payload["activateUrl"] as? String,
                      let destination = URL(string: activateUrl) else {
                    showNativeBillingMessage("Purchase received, but SplashLens could not activate it yet.")
                    return
                }
                webView?.load(URLRequest(url: destination))
            } catch {
                showNativeBillingMessage("SplashLens could not reach the entitlement server.")
            }
        }

        @MainActor
        private func showNativeBillingMessage(_ message: String) {
            let escaped = message
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: " ")
            webView?.evaluateJavaScript("alert('\(escaped)');")
        }
    }
}
