import SwiftUI
import UIKit
import WebKit

struct ContentView: View {
    @State private var reloadID = UUID()

    var body: some View {
        ZStack(alignment: .topTrailing) {
            SplashLensWebView()
                .id(reloadID)
                .ignoresSafeArea(edges: .bottom)
                .background(Color(red: 0.02, green: 0.07, blue: 0.09))

            Button {
                reloadID = UUID()
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(.black.opacity(0.48), in: Circle())
            }
            .accessibilityLabel("Reload SplashLens")
            .padding(.top, 12)
            .padding(.trailing, 12)
        }
    }
}

struct SplashLensWebView: UIViewRepresentable {
    private let storeURL = URL(string: "https://app.splashlens.com/?store=ios")!
    private static let cacheRefreshKey = "SplashLensLastWebCacheRefreshBuild"
    private static let nativeBridgeScript = """
    (() => {
      if (window.__splashLensNativeBridgeInstalled) return;
      window.__splashLensNativeBridgeInstalled = true;

      const post = (name, payload) => {
        const handler = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[name];
        if (!handler) return false;
        handler.postMessage(payload || {});
        return true;
      };

      const nativeShare = (payload = {}) => new Promise((resolve, reject) => {
        const sent = post('splashLensShare', {
          title: payload.title || document.title || 'SplashLens',
          text: payload.text || '',
          url: payload.url || ''
        });
        sent ? resolve() : reject(new Error('Native share unavailable'));
      });

      try {
        Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      } catch (error) {
        window.SplashLensNativeShare = nativeShare;
      }

      window.print = () => {
        post('splashLensPrint', {
          title: document.title || 'SplashLens',
          html: document.documentElement.outerHTML
        });
      };

      const nativeOpen = window.open ? window.open.bind(window) : null;
      window.open = (url = '', target = '', features = '') => {
        if (String(url || '') === '') {
          let html = '';
          return {
            closed: false,
            document: {
              write: chunk => { html += String(chunk || ''); },
              close: () => {
                post('splashLensPrint', {
                  title: document.title || 'SplashLens Field Packet',
                  html: html || document.documentElement.outerHTML
                });
              }
            },
            close: () => {}
          };
        }
        return nativeOpen ? nativeOpen(url, target, features) : null;
      };

      const blobDownloads = new Map();
      const createObjectURL = URL.createObjectURL ? URL.createObjectURL.bind(URL) : null;
      const revokeObjectURL = URL.revokeObjectURL ? URL.revokeObjectURL.bind(URL) : null;

      if (createObjectURL) {
        URL.createObjectURL = blob => {
          const url = createObjectURL(blob);
          blobDownloads.set(url, blob);
          return url;
        };
      }

      if (revokeObjectURL) {
        URL.revokeObjectURL = url => {
          setTimeout(() => blobDownloads.delete(url), 3000);
          setTimeout(() => revokeObjectURL(url), 3000);
        };
      }

      const handleDownloadAnchor = anchor => {
        if (!anchor || !anchor.href || !anchor.download || !anchor.href.startsWith('blob:')) return false;
        const blob = blobDownloads.get(anchor.href);
        if (!blob) return false;
        blob.text()
          .then(text => {
            post('splashLensDownload', {
              filename: anchor.download || 'splashlens-export.txt',
              mimeType: blob.type || 'text/plain',
              text
            });
          })
          .catch(() => false);
        return true;
      };

      const anchorClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function() {
        if (handleDownloadAnchor(this)) return;
        return anchorClick.apply(this, arguments);
      };

      document.addEventListener('click', event => {
        const target = event.target && event.target.closest ? event.target.closest('a[download]') : null;
        if (!target || !target.href || !target.href.startsWith('blob:')) return;
        if (handleDownloadAnchor(target)) event.preventDefault();
      }, true);
    })();
    """

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.allowsInlineMediaPlayback = true
        configuration.userContentController.addUserScript(WKUserScript(
            source: Self.nativeBridgeScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        ))
        configuration.userContentController.add(context.coordinator, name: "splashLensShare")
        configuration.userContentController.add(context.coordinator, name: "splashLensDownload")
        configuration.userContentController.add(context.coordinator, name: "splashLensPrint")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        context.coordinator.webView = webView
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.02, green: 0.07, blue: 0.09, alpha: 1)
        Self.refreshWebCacheIfNeeded {
            webView.load(URLRequest(url: storeURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(storeURL: storeURL)
    }

    private static func refreshWebCacheIfNeeded(completion: @escaping () -> Void) {
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "unknown"
        if UserDefaults.standard.string(forKey: cacheRefreshKey) == build {
            completion()
            return
        }

        let dataTypes: Set<String> = [
            WKWebsiteDataTypeDiskCache,
            WKWebsiteDataTypeFetchCache,
            WKWebsiteDataTypeMemoryCache,
            WKWebsiteDataTypeServiceWorkerRegistrations
        ]
        WKWebsiteDataStore.default().fetchDataRecords(ofTypes: dataTypes) { records in
            let appRecords = records.filter { record in
                let name = record.displayName.lowercased()
                return name.contains("splashlens") || name.contains("app.splashlens.com")
            }
            WKWebsiteDataStore.default().removeData(ofTypes: dataTypes, for: appRecords) {
                UserDefaults.standard.set(build, forKey: cacheRefreshKey)
                DispatchQueue.main.async {
                    completion()
                }
            }
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        private let allowedHosts: Set<String> = ["app.splashlens.com", "splashlens.com", "www.splashlens.com"]
        private let storeURL: URL
        weak var webView: WKWebView?

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
                    webView.load(URLRequest(url: adjusted, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
                    decisionHandler(.cancel)
                    return
                }
            }

            decisionHandler(allowedHosts.contains(url.host ?? "") ? .allow : .cancel)
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            webView.load(URLRequest(url: storeURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            guard navigationAction.targetFrame == nil else { return nil }
            let popup = WKWebView(frame: .zero, configuration: configuration)
            popup.navigationDelegate = self
            popup.uiDelegate = self
            popup.isHidden = true
            webView.addSubview(popup)
            return popup
        }

        func webViewDidClose(_ webView: WKWebView) {
            webView.removeFromSuperview()
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let payload = message.body as? [String: Any] else { return }
            switch message.name {
            case "splashLensShare":
                presentShareSheet(payload: payload)
            case "splashLensDownload":
                presentDownloadSheet(payload: payload)
            case "splashLensPrint":
                presentPrintSheet(payload: payload)
            default:
                break
            }
        }

        private func presentShareSheet(payload: [String: Any]) {
            var items: [Any] = []
            if let text = payload["text"] as? String, !text.isEmpty {
                items.append(text)
            }
            if let urlString = payload["url"] as? String,
               let url = URL(string: urlString),
               !urlString.isEmpty {
                items.append(url)
            }
            if items.isEmpty { return }

            DispatchQueue.main.async {
                let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
                if let title = payload["title"] as? String, !title.isEmpty {
                    controller.setValue(title, forKey: "subject")
                }
                self.present(controller)
            }
        }

        private func presentDownloadSheet(payload: [String: Any]) {
            guard let text = payload["text"] as? String else { return }
            let filename = sanitizedFilename(payload["filename"] as? String ?? "splashlens-export.txt")
            let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)

            do {
                try text.data(using: .utf8)?.write(to: fileURL, options: .atomic)
            } catch {
                return
            }

            DispatchQueue.main.async {
                self.present(UIActivityViewController(activityItems: [fileURL], applicationActivities: nil))
            }
        }

        private func presentPrintSheet(payload: [String: Any]) {
            guard let html = payload["html"] as? String, !html.isEmpty else { return }
            DispatchQueue.main.async {
                let printController = UIPrintInteractionController.shared
                printController.printFormatter = UIMarkupTextPrintFormatter(markupText: html)
                if let title = payload["title"] as? String, !title.isEmpty {
                    printController.printInfo = UIPrintInfo(dictionary: nil)
                    printController.printInfo?.jobName = title
                }
                printController.present(animated: true)
            }
        }

        private func sanitizedFilename(_ raw: String) -> String {
            let fallback = "splashlens-export.txt"
            let cleaned = raw
                .components(separatedBy: CharacterSet(charactersIn: "/\\?%*|\"<>:"))
                .joined(separator: "-")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            return cleaned.isEmpty ? fallback : cleaned
        }

        private func present(_ controller: UIViewController) {
            guard let presenter = topViewController() else { return }
            if let popover = controller.popoverPresentationController {
                popover.sourceView = webView
                popover.sourceRect = webView?.bounds ?? .zero
            }
            presenter.present(controller, animated: true)
        }

        private func topViewController() -> UIViewController? {
            let scene = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .first { $0.activationState == .foregroundActive }
            let root = scene?.windows.first { $0.isKeyWindow }?.rootViewController
            return topViewController(from: root)
        }

        private func topViewController(from controller: UIViewController?) -> UIViewController? {
            if let navigation = controller as? UINavigationController {
                return topViewController(from: navigation.visibleViewController)
            }
            if let tab = controller as? UITabBarController {
                return topViewController(from: tab.selectedViewController)
            }
            if let presented = controller?.presentedViewController {
                return topViewController(from: presented)
            }
            return controller
        }
    }
}
