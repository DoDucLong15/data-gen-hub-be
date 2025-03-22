import { SystemConfigUtils } from 'src/system-configuration/utils/system-config.util';
import { CreateUserDto } from 'src/users/dtos/user.dto';
import { RegisterEntity } from 'src/users/entities/register.entity';

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
          color: #ffffff;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin-top: 20px;
          font-weight: bold;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.2);
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
          <a href="${SystemConfigUtils.approveRegisterUrl || '#'}" class="action-button">Phê duyệt ngay</a>
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

  static getTemplateNotifyAdminRejectRegister(register: RegisterEntity) {
    const supportEmail =
      SystemConfigUtils.adminEmails && SystemConfigUtils.adminEmails.length
        ? SystemConfigUtils.adminEmails[0]
        : '';
    return `
      <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thông Báo Từ Chối Đăng Ký</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    border-bottom: 3px solid #e74c3c;
                }
                .logo {
                    max-height: 60px;
                    margin-bottom: 10px;
                }
                .content {
                    padding: 20px;
                    background-color: #ffffff;
                }
                h1 {
                    color: #e74c3c;
                    font-size: 24px;
                    margin-top: 0;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #777777;
                }
                .options {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .options ol {
                    margin-left: 20px;
                    padding-left: 0;
                }
                .signature {
                    margin-top: 30px;
                    border-top: 1px solid #eeeeee;
                    padding-top: 20px;
                }
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${SystemConfigUtils.logoUrl}" alt="Logo" class="logo">
                    <h2>Thông Báo Quan Trọng</h2>
                </div>
                
                <div class="content">
                    <h1>Yêu Cầu Đăng Ký Của Bạn Đã Bị Từ Chối</h1>
                    
                    <p>Kính gửi <strong>${register.name}</strong>,</p>
                    
                    <p>Cảm ơn bạn đã quan tâm và đăng ký tài khoản tại <strong>${SystemConfigUtils.systemName}</strong>.</p>
                    
                    <p>Chúng tôi rất tiếc phải thông báo rằng yêu cầu đăng ký của bạn đã không được phê duyệt vào thời điểm này. Quyết định này có thể dựa trên một số yếu tố, bao gồm:</p>
                    
                    <ul>
                        <li>Thông tin cung cấp không đầy đủ hoặc không phù hợp với yêu cầu hệ thống</li>
                        <li>Hồ sơ của bạn không phù hợp với các tiêu chí hiện tại của chúng tôi</li>
                        <li>Các hạn chế về quy mô hoặc phạm vi của hệ thống hiện tại</li>
                    </ul>
                    
                    <div class="options">
                        <p>Bạn có thể xem xét các lựa chọn sau:</p>
                        <ol>
                            <li>Gửi lại đơn đăng ký với thông tin đầy đủ và cập nhật hơn</li>
                            <li>Liên hệ với đội ngũ hỗ trợ của chúng tôi theo địa chỉ <a href="mailto:${supportEmail}">${supportEmail}</a> để được giải đáp thêm</li>
                            <li>Thử lại sau khi bạn đã tích lũy thêm kinh nghiệm hoặc đáp ứng các yêu cầu cụ thể</li>
                        </ol>
                    </div>
                    
                    <p>Chúng tôi vẫn đánh giá cao sự quan tâm của bạn và hy vọng sẽ có cơ hội hợp tác trong tương lai.</p>
                    
                    <div class="signature">
                        <p>Trân trọng,</p>
                        <p>
                            <strong>${SystemConfigUtils.systemName}</strong><br>
                            ${SystemConfigUtils.systemName}<br>
                            <a href="mailto:${supportEmail}">${supportEmail}</a>
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} ${SystemConfigUtils.systemName}. Tất cả các quyền được bảo lưu.</p>
                    <p>Địa chỉ: ${SystemConfigUtils.systemName}</p>
                    <p>Email này được gửi tới ${register.email} vì bạn đã đăng ký tài khoản tại hệ thống của chúng tôi.</p>
                </div>
            </div>
        </body>
        </html>
    `;
  }

  static getTemplateNotifyAdminApproveRegister(register: RegisterEntity, roleName: string) {
    const supportEmail =
      SystemConfigUtils.adminEmails && SystemConfigUtils.adminEmails.length
        ? SystemConfigUtils.adminEmails[0]
        : '';
    return `
      <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thông Báo Chấp Nhận Đăng Ký</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    border-bottom: 3px solid #27ae60;
                }
                .logo {
                    max-height: 60px;
                    margin-bottom: 10px;
                }
                .content {
                    padding: 20px;
                    background-color: #ffffff;
                }
                h1 {
                    color: #27ae60;
                    font-size: 24px;
                    margin-top: 0;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #777777;
                }
                .info-box {
                    background-color: #f0f9f0;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #27ae60;
                }
                .button {
                    display: inline-block;
                    background-color: #27ae60;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 12px 25px;
                    border-radius: 4px;
                    margin: 20px 0;
                    font-weight: bold;
                }
                .signature {
                    margin-top: 30px;
                    border-top: 1px solid #eeeeee;
                    padding-top: 20px;
                }
                .account-info {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .account-info table {
                    width: 100%;
                }
                .account-info td {
                    padding: 8px;
                }
                .account-info td:first-child {
                    font-weight: bold;
                    width: 40%;
                }
                @media screen and (max-width: 600px) {
                    .container {
                        width: 100%;
                    }
                    .button {
                        display: block;
                        text-align: center;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${SystemConfigUtils.logoUrl}" alt="Logo" class="logo">
                    <h2>Tin Vui! Tài Khoản Của Bạn Đã Được Kích Hoạt</h2>
                </div>
                
                <div class="content">
                    <h1>Chúc Mừng! Đăng Ký Của Bạn Đã Được Chấp Nhận</h1>
                    
                    <p>Kính gửi <strong>${register.name}</strong>,</p>
                    
                    <p>Chúng tôi vui mừng thông báo rằng đăng ký tài khoản của bạn tại <strong>${SystemConfigUtils.systemName}</strong> đã được chấp nhận và tài khoản của bạn đã được kích hoạt.</p>
                    
                    <div class="info-box">
                        <p>Bạn đã được gán vai trò: <strong>${roleName}</strong></p>
                    </div>
                    
                    <div class="account-info">
                        <h3>Thông Tin Tài Khoản</h3>
                        <table>
                            <tr>
                                <td>Email:</td>
                                <td>${register.email}</td>
                            </tr>
                            <tr>
                                <td>Phòng/Ban:</td>
                                <td>${register.department}</td>
                            </tr>
                            <tr>
                                <td>Chức vụ:</td>
                                <td>${register.position}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p>Để bắt đầu sử dụng tài khoản của bạn, vui lòng nhấp vào nút bên dưới để đăng nhập và đặt mật khẩu:</p>
                    
                    <center>
                        <a href="${SystemConfigUtils.loginUrl}" class="button">Đăng Nhập Ngay</a>
                    </center>
                    
                    <p>Nếu bạn có bất kỳ câu hỏi hoặc cần hỗ trợ, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi tại <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
                    
                    <div class="signature">
                        <p>Trân trọng,</p>
                        <p>
                            <strong>${SystemConfigUtils.systemName}</strong><br>
                            ${SystemConfigUtils.systemName}<br>
                            <a href="mailto:${supportEmail}">${supportEmail}</a>
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} ${SystemConfigUtils.systemName}. Tất cả các quyền được bảo lưu.</p>
                    <p>Địa chỉ: ${SystemConfigUtils.systemName}</p>
                    <p>Email này được gửi tới ${register.email} vì bạn đã đăng ký tài khoản tại hệ thống của chúng tôi.</p>
                </div>
            </div>
        </body>
        </html>
    `;
  }
}
