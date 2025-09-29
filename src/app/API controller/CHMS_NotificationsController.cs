using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CHMS_NotificationsController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_NotificationsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] NotificationRequest notification)
        {
            if (string.IsNullOrWhiteSpace(notification.EmployeeID) ||
                string.IsNullOrWhiteSpace(notification.Message))
            {
                return BadRequest(new { message = "EmployeeID and Message are required." });
            }

            try
            {
                byte[] imageBytes = null;
                Guid? userId = null;

                if (!string.IsNullOrWhiteSpace(notification.ImageData))
                {
                    imageBytes = Convert.FromBase64String(notification.ImageData);
                }

                if (!string.IsNullOrWhiteSpace(notification.UserId))
                {
                    try
                    {
                        userId = Guid.Parse(notification.UserId);
                    }
                    catch
                    {
                        // UserId is not a valid GUID, will use RecipientUserName
                    }
                }

                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_CreateNotification]", connection))
                {
                    command.CommandType = System.Data.CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@UserId", (object)userId ?? DBNull.Value);
                    command.Parameters.AddWithValue("@EmployeeID", notification.EmployeeID);
                    command.Parameters.AddWithValue("@Message", notification.Message);
                    command.Parameters.AddWithValue("@Timestamp", notification.Timestamp);
                    command.Parameters.AddWithValue("@RecipientUserName", (object)notification.RecipientUserName ?? DBNull.Value);
                    command.Parameters.AddWithValue("@Priority", (object)notification.Priority ?? "Normal");

                    var imageDataParam = new SqlParameter("@ImageData", System.Data.SqlDbType.VarBinary)
                    {
                        Value = (object)imageBytes ?? DBNull.Value
                    };
                    command.Parameters.Add(imageDataParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return Ok(new { message = "Notification created successfully." });
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the notification.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the notification.", error = ex.Message });
            }
        }

        [HttpGet("by-recipient-username/{recipientUserName}")]
        public async Task<IActionResult> GetNotificationsByRecipientUserName(string recipientUserName, [FromQuery] bool includeArchived = false)
        {
            if (string.IsNullOrWhiteSpace(recipientUserName))
            {
                return BadRequest(new { message = "RecipientUserName is required." });
            }

            try
            {
                var notifications = new List<NotificationResponse>();
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetNotificationsByRecipientUserName]", connection))
                {
                    command.CommandType = System.Data.CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@RecipientUserName", recipientUserName);
                    command.Parameters.AddWithValue("@IncludeArchived", includeArchived);

                    await connection.OpenAsync();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            notifications.Add(new NotificationResponse
                            {
                                NotificationID = reader.GetInt32(0),
                                UserId = reader.GetGuid(1).ToString(),
                                EmployeeID = reader.GetString(2),
                                Message = reader.GetString(3),
                                Timestamp = reader.GetDateTime(4),
                                IsRead = reader.GetBoolean(5),
                                ImageData = reader.IsDBNull(6) ? null : (byte[])reader.GetValue(6),
                                RecipientUserName = reader.IsDBNull(7) ? null : reader.GetString(7),
                                Priority = reader.IsDBNull(8) ? "Normal" : reader.GetString(8)
                            });
                        }
                    }
                }
                return Ok(notifications);
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving notifications.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving notifications.", error = ex.Message });
            }
        }

        [HttpGet("by-employee/{employeeId}")]
        public async Task<IActionResult> GetNotificationsByEmployeeId(string employeeId, [FromQuery] bool includeArchived = false)
        {
            if (string.IsNullOrWhiteSpace(employeeId))
            {
                return BadRequest(new { message = "EmployeeID is required." });
            }

            try
            {
                var notifications = new List<NotificationResponse>();
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetNotificationsByEmployeeID]", connection))
                {
                    command.CommandType = System.Data.CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@EmployeeID", employeeId);
                    command.Parameters.AddWithValue("@IncludeArchived", includeArchived);

                    await connection.OpenAsync();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            notifications.Add(new NotificationResponse
                            {
                                NotificationID = reader.GetInt32(0),
                                UserId = reader.GetGuid(1).ToString(),
                                EmployeeID = reader.GetString(2),
                                Message = reader.GetString(3),
                                Timestamp = reader.GetDateTime(4),
                                IsRead = reader.GetBoolean(5),
                                ImageData = reader.IsDBNull(6) ? null : (byte[])reader.GetValue(6),
                                RecipientUserName = reader.IsDBNull(7) ? null : reader.GetString(7),
                                Priority = reader.IsDBNull(8) ? "Normal" : reader.GetString(8)
                            });
                        }
                    }
                }
                return Ok(notifications);
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving notifications.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving notifications.", error = ex.Message });
            }
        }

        [HttpGet("unread-count/{employeeId}")]
        public async Task<IActionResult> GetUnreadNotificationsCount(string employeeId)
        {
            if (string.IsNullOrWhiteSpace(employeeId))
            {
                return BadRequest(new { message = "EmployeeID is required." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetUnreadNotificationsCount]", connection))
                {
                    command.CommandType = System.Data.CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@EmployeeID", employeeId);

                    await connection.OpenAsync();
                    var count = (int)await command.ExecuteScalarAsync();

                    return Ok(new { UnreadCount = count });
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving unread count.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving unread count.", error = ex.Message });
            }
        }

        [HttpPut("mark-read/{notificationId}")]
        public async Task<IActionResult> MarkNotificationAsRead(int notificationId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_MarkNotificationAsRead]", connection))
                {
                    command.CommandType = System.Data.CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@NotificationID", notificationId);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return Ok(new { message = "Notification marked as read." });
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while marking notification as read.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while marking notification as read.", error = ex.Message });
            }
        }
    }

    public class NotificationRequest
    {
        public string UserId { get; set; }
        public string EmployeeID { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
        public string ImageData { get; set; }
        public string RecipientUserName { get; set; }
        public string Priority { get; set; } // Added Priority
    }

    public class NotificationResponse
    {
        public int NotificationID { get; set; }
        public string UserId { get; set; }
        public string EmployeeID { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsRead { get; set; }
        public byte[] ImageData { get; set; }
        public string RecipientUserName { get; set; }
        public string Priority { get; set; } // Added Priority
    }
}