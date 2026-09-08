const NotificationContentSwift = (config, pluginSettings) => {
  const code = `import UIKit
import UserNotifications
import UserNotificationsUI
import MoEngageRichNotification
  
class NotificationViewController: UIViewController, UNNotificationContentExtension {
    override func viewDidLoad() {
        super.viewDidLoad()
        // Set App Group ID
        MoEngageSDKRichNotification.setAppGroupID("group.${config?.ios?.bundleIdentifier}")
    }
  
    
    func didReceive(_ notification: UNNotification) {
        // Method to add template to UI
        MoEngageSDKRichNotification.addPushTemplate(toController: self, withNotification: notification)
    }
}
  `
  return code;
  }
  
  module.exports = NotificationContentSwift;