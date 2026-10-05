import SwiftUI
import WebKit
import PhotosUI

struct ContentView: View {
    var body: some View {
        SplashLensWebView()
            .ignoresSafeArea(edges: .bottom)
            .background(Color(red: 0.02, green: 0.07, blue: 0.09))
    }
}

struct SplashLensWebView: UIViewRepresentable {
    private let storeURL = URL(string: "https://app.splashlens.com/?store=ios")!
    private static let nativeBridgeScript = """
    (function () {
      window.SplashLensNative = window.SplashLensNative || {};
      if (window.SplashLensNative.__galleryBridgeReady) return;
      window.SplashLensNative.__galleryBridgeReady = true;
      window.SplashLensNative.__galleryResolvers = window.SplashLensNative.__galleryResolvers || {};
      window.SplashLensNative.pickGalleryPhoto = function () {
        return new Promise(function (resolve, reject) {
          var requestId = 'gallery_' + Date.now() + '_' + Math.random().toString(36).slice(2);
          window.SplashLensNative.__galleryResolvers[requestId] = { resolve: resolve, reject: reject };
          try {
            window.webkit.messageHandlers.splashlensNativeGallery.postMessage({ requestId: requestId });
          } catch (error) {
            delete window.SplashLensNative.__galleryResolvers[requestId];
            reject(new Error('native_gallery_unavailable'));
          }
        });
      };
      window.SplashLensNative.__resolveGalleryPhoto = function (payload) {
        var requestId = payload && payload.requestId;
        var resolver = requestId && window.SplashLensNative.__galleryResolvers[requestId];
        if (!resolver) return;
        delete window.SplashLensNative.__galleryResolvers[requestId];
        resolver.resolve(payload);
      };
      window.SplashLensNative.__rejectGalleryPhoto = function (payload) {
        var requestId = payload && payload.requestId;
        var resolver = requestId && window.SplashLensNative.__galleryResolvers[requestId];
        if (!resolver) return;
        delete window.SplashLensNative.__galleryResolvers[requestId];
        resolver.reject(new Error((payload && payload.reason) || 'native_gallery_failed'));
      };
    })();
    """

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.allowsInlineMediaPlayback = true
        let bridgeScript = WKUserScript(
            source: Self.nativeBridgeScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        configuration.userContentController.addUserScript(bridgeScript)
        configuration.userContentController.add(context.coordinator, name: "splashlensNativeGallery")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        context.coordinator.attach(webView)
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.02, green: 0.07, blue: 0.09, alpha: 1)
        webView.load(URLRequest(url: storeURL, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "splashlensNativeGallery")
        webView.navigationDelegate = nil
        webView.uiDelegate = nil
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(storeURL: storeURL)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, PHPickerViewControllerDelegate {
        private let allowedHosts: Set<String> = ["app.splashlens.com"]
        private let storeURL: URL
        private weak var webView: WKWebView?
        private var galleryRequestId: String?

        init(storeURL: URL) {
            self.storeURL = storeURL
        }

        func attach(_ webView: WKWebView) {
            self.webView = webView
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if shouldOpenExternally(url) {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }

            decisionHandler(url.scheme == "https" && allowedHosts.contains(url.host?.lowercased() ?? "") ? .allow : .cancel)
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url,
               url.scheme == "https" || shouldOpenExternally(url) {
                UIApplication.shared.open(url)
            }
            return nil
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            webView.load(URLRequest(url: storeURL, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30))
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "splashlensNativeGallery",
                  message.frameInfo.isMainFrame,
                  message.frameInfo.securityOrigin.protocol == "https",
                  message.frameInfo.securityOrigin.host == "app.splashlens.com",
                  let body = message.body as? [String: Any],
                  let requestId = body["requestId"] as? String,
                  requestId.count <= 120 else {
                return
            }
            guard galleryRequestId == nil else {
                rejectGalleryRequest(requestId: requestId, reason: "gallery_busy")
                return
            }
            galleryRequestId = requestId
            presentGalleryPicker()
        }

        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)
            guard let requestId = galleryRequestId else { return }
            galleryRequestId = nil

            guard let provider = results.first?.itemProvider else {
                rejectGalleryRequest(requestId: requestId, reason: "gallery_cancelled")
                return
            }

            provider.loadObject(ofClass: UIImage.self) { [weak self] object, error in
                guard let self else { return }
                guard let image = object as? UIImage, error == nil else {
                    self.rejectGalleryRequest(requestId: requestId, reason: "gallery_read_failed")
                    return
                }
                // Normalize HEIC and large camera photos for the existing canvas upload path.
                let scale = min(1, 1600 / max(image.size.width, image.size.height))
                let size = CGSize(width: max(1, image.size.width * scale), height: max(1, image.size.height * scale))
                let format = UIGraphicsImageRendererFormat()
                format.scale = 1
                format.opaque = true
                let normalized = UIGraphicsImageRenderer(size: size, format: format).image { _ in
                    image.draw(in: CGRect(origin: .zero, size: size))
                }
                guard let data = normalized.jpegData(compressionQuality: 0.9) else {
                    self.rejectGalleryRequest(requestId: requestId, reason: "gallery_read_failed")
                    return
                }
                self.resolveGalleryRequest(
                    requestId: requestId,
                    name: "splashlens-gallery.jpg",
                    mimeType: "image/jpeg",
                    base64: data.base64EncodedString()
                )
            }
        }

        private func shouldOpenExternally(_ url: URL) -> Bool {
            if url.scheme == "mailto" || url.scheme == "tel" || url.scheme == "sms" {
                return true
            }

            guard let host = url.host?.lowercased() else {
                return false
            }
            guard url.scheme == "https" else { return false }

            if host == "app.splashlens.com" {
                let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
                let store = components?.queryItems?.first { $0.name.lowercased() == "store" }?.value?.lowercased()
                return store != "ios"
            }

            return host == "splashlens.com" || host == "www.splashlens.com"
        }

        private func presentGalleryPicker() {
            var configuration = PHPickerConfiguration(photoLibrary: .shared())
            configuration.filter = .images
            configuration.selectionLimit = 1
            let picker = PHPickerViewController(configuration: configuration)
            picker.delegate = self
            guard let presenter = topViewController() else {
                if let requestId = galleryRequestId {
                    rejectGalleryRequest(requestId: requestId, reason: "gallery_presenter_unavailable")
                }
                galleryRequestId = nil
                return
            }
            presenter.present(picker, animated: true)
        }

        private func topViewController() -> UIViewController? {
            let window = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }
            var top = window?.rootViewController
            while let presented = top?.presentedViewController {
                top = presented
            }
            return top
        }

        private func resolveGalleryRequest(requestId: String, name: String, mimeType: String, base64: String) {
            let payload = [
                "requestId": requestId,
                "name": name,
                "type": mimeType,
                "dataUrl": "data:\(mimeType);base64,\(base64)"
            ]
            sendGalleryCallback(function: "__resolveGalleryPhoto", payload: payload)
        }

        private func rejectGalleryRequest(requestId: String, reason: String) {
            sendGalleryCallback(function: "__rejectGalleryPhoto", payload: [
                "requestId": requestId,
                "reason": reason
            ])
        }

        private func sendGalleryCallback(function: String, payload: [String: String]) {
            guard let data = try? JSONSerialization.data(withJSONObject: payload),
                  let json = String(data: data, encoding: .utf8) else {
                return
            }
            DispatchQueue.main.async { [weak self] in
                self?.webView?.evaluateJavaScript("window.SplashLensNative && window.SplashLensNative.\(function)(\(json));")
            }
        }
    }
}
