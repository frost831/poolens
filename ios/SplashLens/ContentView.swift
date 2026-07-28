import SwiftUI
import StoreKit
import UserNotifications
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
        configuration.userContentController.add(context.coordinator, name: "splashlensNotifications")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        context.coordinator.attach(webView)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.02, green: 0.07, blue: 0.09, alpha: 1)
        webView.load(URLRequest(url: context.coordinator.initialURL(), cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
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
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(handleNotificationDeepLink(_:)),
                name: SplashLensNotificationRouter.didReceiveDeepLink,
                object: nil
            )
            DispatchQueue.main.async { [weak self] in
                guard let pending = SplashLensNotificationRouter.pendingDeepLink,
                      self?.allowedHosts.contains(pending.host ?? "") == true else { return }
                SplashLensNotificationRouter.pendingDeepLink = nil
                self?.webView?.load(URLRequest(url: pending))
            }
        }

        deinit {
            NotificationCenter.default.removeObserver(self)
        }

        func initialURL() -> URL {
            defer { SplashLensNotificationRouter.pendingDeepLink = nil }
            guard let pending = SplashLensNotificationRouter.pendingDeepLink,
                  allowedHosts.contains(pending.host ?? "") else { return storeURL }
            return pending
        }

        @objc private func handleNotificationDeepLink(_ notification: Notification) {
            guard let url = notification.object as? URL,
                  allowedHosts.contains(url.host ?? "") else { return }
            webView?.load(URLRequest(url: url))
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "splashlensNotifications" {
                handleNotificationMessage(message.body)
                return
            }
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

        private func handleNotificationMessage(_ body: Any) {
            guard let payload = body as? [String: Any],
                  let action = payload["action"] as? String else { return }

            switch action {
            case "request":
                UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge]) { [weak self] granted, error in
                    let status = error == nil ? (granted ? "granted" : "denied") : "error"
                    DispatchQueue.main.async {
                        self?.sendNotificationPermissionResult(granted: granted, status: status)
                    }
                }
            case "schedule":
                scheduleNotification(payload)
            case "cancelAll":
                UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
                    let identifiers = requests.map(\.identifier).filter { $0.hasPrefix("splashlens-field-signal-") }
                    UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiers)
                    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiers)
                }
            default:
                return
            }
        }

        private func scheduleNotification(_ payload: [String: Any]) {
            let signalId = payload["id"] as? String ?? UUID().uuidString
            let content = UNMutableNotificationContent()
            content.title = payload["title"] as? String ?? "SplashLens Field Signal"
            content.body = payload["body"] as? String ?? ""
            content.userInfo = ["deepLink": payload["deepLink"] as? String ?? storeURL.absoluteString]

            let fireDate = (payload["fireAt"] as? String).flatMap { ISO8601DateFormatter().date(from: $0) }
            let interval = max(1, fireDate?.timeIntervalSinceNow ?? 1)
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
            let request = UNNotificationRequest(
                identifier: "splashlens-field-signal-\(signalId)",
                content: content,
                trigger: trigger
            )
            UNUserNotificationCenter.current().add(request)
        }

        @MainActor
        private func sendNotificationPermissionResult(granted: Bool, status: String) {
            let safeStatus = status.replacingOccurrences(of: "'", with: "")
            let grantedLiteral = granted ? "true" : "false"
            webView?.evaluateJavaScript(
                "window.SplashLensFieldSignals?.nativePermissionResult(\(grantedLiteral),'\(safeStatus)');"
            )
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if shouldOpenExternally(url) {
                openExternally(url)
                decisionHandler(.cancel)
                return
            }

            if url.host == "app.splashlens.com", !hasStoreFlag(url) {
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

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            guard navigationAction.targetFrame == nil, let url = navigationAction.request.url else {
                return nil
            }
            if shouldOpenExternally(url) {
                openExternally(url)
            } else {
                webView.load(URLRequest(url: url))
            }
            return nil
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            webView.load(URLRequest(url: storeURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
        }

        private func hasStoreFlag(_ url: URL) -> Bool {
            URLComponents(url: url, resolvingAgainstBaseURL: false)?
                .queryItems?
                .contains { $0.name == "store" && $0.value == "ios" } == true
        }

        private func shouldOpenExternally(_ url: URL) -> Bool {
            let scheme = (url.scheme ?? "").lowercased()
            if scheme == "mailto" || scheme == "tel" {
                return true
            }
            guard scheme == "http" || scheme == "https" else {
                return false
            }
            if url.host == "app.splashlens.com" {
                return url.path == "/dashboard" || url.path == "/dashboard.html" || url.path.hasPrefix("/api/checkout")
            }
            return !allowedHosts.contains(url.host ?? "")
        }

        private func openExternally(_ url: URL) {
            UIApplication.shared.open(url)
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
