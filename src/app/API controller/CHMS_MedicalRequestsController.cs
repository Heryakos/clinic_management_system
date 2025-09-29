using HospitalManagementSystem.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace HospitalManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CHMS_MedicalRequestsController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_MedicalRequestsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MedicalRequestView>>> GetMedicalRequests()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_MedicalRequests WHERE Status IN ('Approved', 'Pending') AND is_sick_leave = 0;", connection))
                {
                    await connection.OpenAsync();
                    var requests = new List<MedicalRequestView>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            requests.Add(new MedicalRequestView
                            {
                                RequestID = reader.GetInt32(reader.GetOrdinal("RequestID")),
                                RequestNumber = reader.GetString(reader.GetOrdinal("RequestNumber")),
                                EmployeeCode = reader.GetString(reader.GetOrdinal("EmployeeCode")),
                                EmployeeName = reader.GetString(reader.GetOrdinal("EmployeeName")),
                                Department = reader.GetString(reader.GetOrdinal("Department")),
                                Position = reader.GetString(reader.GetOrdinal("Position")),
                                RequestDate = reader.GetDateTime(reader.GetOrdinal("RequestDate")),
                                RequestType = reader.GetString(reader.GetOrdinal("RequestType")),
                                Reason = reader.IsDBNull(reader.GetOrdinal("Reason")) ? null : reader.GetString(reader.GetOrdinal("Reason")),
                                SupervisorApproval = reader.GetBoolean(reader.GetOrdinal("SupervisorApproval")),
                                SupervisorComments = reader.IsDBNull(reader.GetOrdinal("SupervisorComments")) ? null : reader.GetString(reader.GetOrdinal("SupervisorComments")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                ApprovedByName = reader.IsDBNull(reader.GetOrdinal("ApprovedByName")) ? null : reader.GetString(reader.GetOrdinal("ApprovedByName")),
                                ApprovedDate = reader.IsDBNull(reader.GetOrdinal("ApprovedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ApprovedDate")),
                                CreatedByName = reader.IsDBNull(reader.GetOrdinal("CreatedByName")) ? null : reader.GetString(reader.GetOrdinal("CreatedByName")),
                                IsSickLeave = reader.GetBoolean(reader.GetOrdinal("is_sick_leave")),
                                PreferredDate = reader.IsDBNull(reader.GetOrdinal("PreferredDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("PreferredDate")),
                                PreferredTime = reader.IsDBNull(reader.GetOrdinal("PreferredTime")) ? (TimeSpan?)null : reader.GetTimeSpan(reader.GetOrdinal("PreferredTime"))
                            });
                        }
                    }

                    return Ok(requests);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving medical requests.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving medical requests.", error = ex.Message });
            }
        }

        [HttpGet("Payrol_ID")]
        public async Task<ActionResult<IEnumerable<MedicalRequestView>>> GetMedicalRequests(string payrolId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetMedicalRequestsByTeamLeader]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add(new SqlParameter("@Payrol_ID", SqlDbType.NVarChar)).Value = payrolId;

                    await connection.OpenAsync();
                    var requests = new List<MedicalRequestView>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            requests.Add(new MedicalRequestView
                            {
                                RequestID = reader.GetInt32(reader.GetOrdinal("RequestID")),
                                RequestNumber = reader.GetString(reader.GetOrdinal("RequestNumber")),
                                EmployeeCode = reader.GetString(reader.GetOrdinal("EmployeeCode")),
                                EmployeeName = reader.GetString(reader.GetOrdinal("EmployeeName")),
                                Department = reader.GetString(reader.GetOrdinal("Department")),
                                Position = reader.GetString(reader.GetOrdinal("Position")),
                                RequestDate = reader.GetDateTime(reader.GetOrdinal("RequestDate")),
                                RequestType = reader.GetString(reader.GetOrdinal("RequestType")),
                                Reason = reader.IsDBNull(reader.GetOrdinal("Reason")) ? null : reader.GetString(reader.GetOrdinal("Reason")),
                                SupervisorApproval = reader.GetBoolean(reader.GetOrdinal("SupervisorApproval")),
                                SupervisorComments = reader.IsDBNull(reader.GetOrdinal("SupervisorComments")) ? null : reader.GetString(reader.GetOrdinal("SupervisorComments")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                ApprovedByName = reader.IsDBNull(reader.GetOrdinal("ApprovedByName")) ? null : reader.GetString(reader.GetOrdinal("ApprovedByName")),
                                ApprovedDate = reader.IsDBNull(reader.GetOrdinal("ApprovedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ApprovedDate")),
                                CreatedByName = reader.IsDBNull(reader.GetOrdinal("CreatedByName")) ? null : reader.GetString(reader.GetOrdinal("CreatedByName")),
                                IsSickLeave = reader.GetBoolean(reader.GetOrdinal("is_sick_leave")),
                                PreferredDate = reader.IsDBNull(reader.GetOrdinal("PreferredDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("PreferredDate")),
                                PreferredTime = reader.IsDBNull(reader.GetOrdinal("PreferredTime")) ? (TimeSpan?)null : reader.GetTimeSpan(reader.GetOrdinal("PreferredTime"))
                            });
                        }
                    }

                    return Ok(requests);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving medical requests.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving medical requests.", error = ex.Message });
            }
        }

        [HttpGet("by-employee-code/{employeeCode}")]
        public async Task<ActionResult<IEnumerable<MedicalRequestView>>> GetMedicalRequestsByEmployeeCode(string employeeCode)
        {
            if (string.IsNullOrWhiteSpace(employeeCode))
                return BadRequest(new { message = "Invalid Employee Code." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_MedicalRequests WHERE EmployeeCode = @EmployeeCode ORDER BY RequestDate DESC", connection))
                {
                    command.Parameters.Add("@EmployeeCode", SqlDbType.NVarChar).Value = employeeCode;
                    await connection.OpenAsync();

                    var requests = new List<MedicalRequestView>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            requests.Add(new MedicalRequestView
                            {
                                RequestID = reader.GetInt32(reader.GetOrdinal("RequestID")),
                                RequestNumber = reader.GetString(reader.GetOrdinal("RequestNumber")),
                                EmployeeCode = reader.GetString(reader.GetOrdinal("EmployeeCode")),
                                EmployeeName = reader.GetString(reader.GetOrdinal("EmployeeName")),
                                Department = reader.GetString(reader.GetOrdinal("Department")),
                                Position = reader.GetString(reader.GetOrdinal("Position")),
                                RequestDate = reader.GetDateTime(reader.GetOrdinal("RequestDate")),
                                RequestType = reader.GetString(reader.GetOrdinal("RequestType")),
                                Reason = reader.IsDBNull(reader.GetOrdinal("Reason")) ? null : reader.GetString(reader.GetOrdinal("Reason")),
                                SupervisorApproval = reader.GetBoolean(reader.GetOrdinal("SupervisorApproval")),
                                SupervisorComments = reader.IsDBNull(reader.GetOrdinal("SupervisorComments")) ? null : reader.GetString(reader.GetOrdinal("SupervisorComments")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                ApprovedByName = reader.IsDBNull(reader.GetOrdinal("ApprovedByName")) ? null : reader.GetString(reader.GetOrdinal("ApprovedByName")),
                                ApprovedDate = reader.IsDBNull(reader.GetOrdinal("ApprovedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ApprovedDate")),
                                CreatedByName = reader.IsDBNull(reader.GetOrdinal("CreatedByName")) ? null : reader.GetString(reader.GetOrdinal("CreatedByName")),
                                IsSickLeave = reader.GetBoolean(reader.GetOrdinal("is_sick_leave")),
                                PreferredDate = reader.IsDBNull(reader.GetOrdinal("PreferredDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("PreferredDate")),
                                PreferredTime = reader.IsDBNull(reader.GetOrdinal("PreferredTime")) ? (TimeSpan?)null : reader.GetTimeSpan(reader.GetOrdinal("PreferredTime"))
                            });
                        }
                    }

                    if (requests.Count == 0)
                        return NotFound(new { message = "No medical requests found for this employee." });

                    return Ok(requests);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving medical requests.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving medical requests.", error = ex.Message });
            }
        }

        [HttpGet("by-employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<MedicalRequest>>> GetMedicalRequestsByEmployeeId(string employeeId)
        {
            if (string.IsNullOrWhiteSpace(employeeId))
                return BadRequest(new { message = "Invalid Employee ID." });

            try
            {
                var requests = new List<MedicalRequest>();

                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].MedicalRequests WHERE EmployeeID = @EmployeeID", connection))
                {
                    command.Parameters.Add("@EmployeeID", SqlDbType.NVarChar).Value = employeeId;
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var request = new MedicalRequest
                            {
                                RequestID = reader.GetInt32(reader.GetOrdinal("RequestID")),
                                RequestNumber = reader.GetString(reader.GetOrdinal("RequestNumber")),
                                EmployeeID = reader.GetString(reader.GetOrdinal("EmployeeID")),
                                RequestDate = reader.GetDateTime(reader.GetOrdinal("RequestDate")),
                                RequestType = reader.GetString(reader.GetOrdinal("RequestType")),
                                Reason = reader.IsDBNull(reader.GetOrdinal("Reason")) ? null : reader.GetString(reader.GetOrdinal("Reason")),
                                SupervisorApproval = reader.GetBoolean(reader.GetOrdinal("SupervisorApproval")),
                                SupervisorComments = reader.IsDBNull(reader.GetOrdinal("SupervisorComments")) ? null : reader.GetString(reader.GetOrdinal("SupervisorComments")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                ApprovedBy = reader.IsDBNull(reader.GetOrdinal("ApprovedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("ApprovedBy")),
                                ApprovedDate = reader.IsDBNull(reader.GetOrdinal("ApprovedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ApprovedDate")),
                                CompletedDate = reader.IsDBNull(reader.GetOrdinal("CompletedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("CompletedDate")),
                                CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("CreatedBy")),
                                IsSickLeave = reader.GetBoolean(reader.GetOrdinal("is_sick_leave")),
                                PreferredDate = reader.IsDBNull(reader.GetOrdinal("PreferredDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("PreferredDate")),
                                PreferredTime = reader.IsDBNull(reader.GetOrdinal("PreferredTime")) ? (TimeSpan?)null : reader.GetTimeSpan(reader.GetOrdinal("PreferredTime"))
                            };

                            requests.Add(request);
                        }
                    }
                }

                if (requests.Count == 0)
                    return NotFound(new { message = "No medical requests found for this employee." });

                return Ok(requests);
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving medical requests.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving medical requests.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<MedicalRequest>> CreateMedicalRequest([FromBody] MedicalRequest request)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_CreateMedicalRequest", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestNumber", SqlDbType.NVarChar).Value = request.RequestNumber;
                    command.Parameters.Add("@EmployeeID", SqlDbType.NVarChar).Value = request.EmployeeID;
                    command.Parameters.Add("@RequestType", SqlDbType.NVarChar).Value = request.RequestType;
                    command.Parameters.Add("@Reason", SqlDbType.NVarChar).Value = request.Reason != null ? (object)request.Reason : DBNull.Value;
                    command.Parameters.Add("@CreatedBy", SqlDbType.UniqueIdentifier).Value = request.CreatedBy;
                    command.Parameters.Add("@PreferredDate", SqlDbType.Date).Value = request.PreferredDate != null ? (object)request.PreferredDate : DBNull.Value;
                    command.Parameters.Add("@PreferredTime", SqlDbType.Time).Value = request.PreferredTime != null ? (object)request.PreferredTime : DBNull.Value;
                    var requestIdParam = new SqlParameter("@RequestID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(requestIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    request.RequestID = (int)requestIdParam.Value;
                    return CreatedAtAction(nameof(GetMedicalRequestsByEmployeeId), new { employeeId = request.EmployeeID }, request);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the medical request.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the medical request.", error = ex.Message });
            }
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveMedicalRequest(int id, [FromBody] ApprovalRequest approval)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_ApproveMedicalRequest", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestID", SqlDbType.Int).Value = id;
                    command.Parameters.Add("@Status", SqlDbType.NVarChar).Value = approval.Status;
                    command.Parameters.Add("@SupervisorComments", SqlDbType.NVarChar).Value = approval.Comments != null ? (object)approval.Comments : DBNull.Value;
                    command.Parameters.Add("@ApprovedBy", SqlDbType.UniqueIdentifier).Value = approval.ApprovedBy;

                    await connection.OpenAsync();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var result = reader.GetString(reader.GetOrdinal("Result"));
                            if (result != "Success")
                                return StatusCode(500, new { message = "Failed to approve medical request." });
                        }
                        else
                        {
                            return NotFound(new { message = "Medical request not found." });
                        }
                    }

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while approving the medical request.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while approving the medical request.", error = ex.Message });
            }
        }
    }
}