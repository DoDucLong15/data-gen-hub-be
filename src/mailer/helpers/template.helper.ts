import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';
import { CreateUserDto } from 'src/users/dtos/user.dto';

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

  static getTemplateNotifyAdminNewUser(userData: CreateUserDto) {
    return `
      <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4f46e5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 20px;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
        }
        .footer {
          background-color: #f3f4f6;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-radius: 0 0 5px 5px;
          border: 1px solid #e5e7eb;
        }
        .user-info {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .user-info p {
          margin: 5px 0;
        }
        .label {
          font-weight: bold;
          width: 120px;
          display: inline-block;
        }
        .action-button {
          display: inline-block;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Yêu cầu đăng ký tài khoản mới</h2>
        </div>
        <div class="content">
          <p>Kính gửi Quản trị viên,</p>
          <p>Hệ thống vừa nhận được một yêu cầu đăng ký tài khoản mới. Dưới đây là thông tin chi tiết:</p>
          
          <div class="user-info">
            <p><span class="label">Email:</span> ${userData.email}</p>
            <p><span class="label">Họ và tên:</span> ${userData.name || 'Không cung cấp'}</p>
            <p><span class="label">Số điện thoại:</span> ${userData.phone || 'Không cung cấp'}</p>
            <p><span class="label">Trường học:</span> ${userData.school || 'Không cung cấp'}</p>
            <p><span class="label">Khoa/Phòng ban:</span> ${userData.department || 'Không cung cấp'}</p>
            <p><span class="label">Chức vụ:</span> ${userData.position || 'Không cung cấp'}</p>
            <p><span class="label">Thời gian:</span> ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          
          <p>Vui lòng xem xét và phê duyệt yêu cầu này trong hệ thống quản trị.</p>
        </div>
        <div class="footer">
          <p>Đây là email tự động từ hệ thống. Vui lòng không trả lời email này.</p>
          <p>&copy; ${new Date().getFullYear()} Hệ thống Quản lý</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}
