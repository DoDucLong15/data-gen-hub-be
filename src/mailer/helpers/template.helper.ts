import { SystemConfigUtils } from "src/system-configuration/utils/system-config.util";

export class TemplateHelper {
  static getTemplateNotifyNewUser(name: string) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thông báo tạo tài khoản</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
              }
              .container {
                  max-width: 600px;
                  background: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  text-align: center;
              }
              .logo {
                  width: 100px;
                  margin-bottom: 20px;
              }
              .header {
                  font-size: 24px;
                  font-weight: bold;
                  color: #333;
              }
              .content {
                  margin-top: 20px;
                  font-size: 16px;
                  color: #555;
              }
              .button {
                  display: inline-block;
                  width: 200px;
                  text-align: center;
                  background: #007bff;
                  color: white;
                  padding: 10px;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 20px auto;
              }
              .footer {
                  font-size: 14px;
                  color: #888;
                  margin-top: 20px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <img src="${SystemConfigUtils.logoUrl}" alt="Logo Hệ Thống" class="logo">
              <div class="header">Chào mừng ${name} đến với hệ thống!</div>
              <div class="content">
                  <p>Xin chào,</p>
                  <p>Tài khoản của bạn đã được tạo thành công trong hệ thống <strong>${SystemConfigUtils.systemName}</strong>. Vui lòng nhấn vào nút bên dưới để đăng nhập:</p>
                  <a href="${SystemConfigUtils.loginUrl}" class="button">Đăng nhập ngay</a>
                  <p>Nếu bạn không yêu cầu tạo tài khoản này, vui lòng bỏ qua email này.</p>
              </div>
              <div class="footer">
                  &copy; 2025 ${SystemConfigUtils.systemName}. Mọi quyền được bảo lưu.
              </div>
          </div>
      </body>
      </html>
    `;
  }
}
