import SwiftUI
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

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.02, green: 0.07, blue: 0.09, alpha: 1)
        webView.load(URLRequest(url: storeURL, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(storeURL: storeURL)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private let allowedHosts: Set<String> = ["app.splashlens.com", "splashlens.com", "www.splashlens.com"]
        private let storeURL: URL

        init(storeURL: URL) {
            self.storeURL = storeURL
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
            webView.load(URLRequest(url: storeURL, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30))
        }
    }
}
