import SwiftUI
import UserNotifications

enum SplashLensNotificationRouter {
    static let didReceiveDeepLink = Notification.Name("SplashLensNotificationDeepLink")
    static var pendingDeepLink: URL?

    static func route(_ url: URL) {
        DispatchQueue.main.async {
            pendingDeepLink = url
            NotificationCenter.default.post(name: didReceiveDeepLink, object: url)
        }
    }
}

final class SplashLensAppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    private let allowedHosts: Set<String> = ["app.splashlens.com", "splashlens.com", "www.splashlens.com"]

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .list])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        defer { completionHandler() }
        guard let value = response.notification.request.content.userInfo["deepLink"] as? String,
              let url = URL(string: value),
              allowedHosts.contains(url.host ?? "") else { return }
        SplashLensNotificationRouter.route(url)
    }
}

@main
struct SplashLensApp: App {
    @UIApplicationDelegateAdaptor(SplashLensAppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
