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
    public class CHMS_SickLeaveController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_SickLeaveController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetSickLeaveCertificates()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_SickLeaveCertificates ORDER BY IssueDate DESC", connection))
                {
                    await connection.OpenAsync();
                    var certificates = new List<Dictionary<string, object>>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var certificate = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                certificate[columnName] = value;
                            }
                            certificates.Add(certificate);
                        }
                    }

                    if (certificates.Count == 0)
                        return NotFound(new { message = "No sick leave certificates found." });

                    return Ok(certificates);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving sick leave certificates.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving sick leave certificates.", error = ex.Message });
            }
        }

        // GET: api/CHMS_Pharmacy/sickleave/{cardNumber}
        [HttpGet("sickleave/{cardNumber}")]
        public async Task<IActionResult> GetSickLeaveCertificateByCardNumber(string cardNumber)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();

                    using (var command = new SqlCommand("[CHMS].sp_GetSickLeaveCertificateByCardNumber", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@CardNumber", cardNumber);

                        var results = new List<Dictionary<string, object>>();

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();

                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = await reader.IsDBNullAsync(i) ? null : reader.GetValue(i);
                                }

                                results.Add(row);
                            }
                        }

                        return Ok(results);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }


        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetSickLeaveCertificatesByEmployeeID(string employeeId)
        {
            if (string.IsNullOrWhiteSpace(employeeId))
                return BadRequest(new { message = "EmployeeID is required." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_SickLeaveCertificates WHERE EmployeeID = @EmployeeID ORDER BY IssueDate DESC", connection))
                {
                    command.Parameters.Add("@EmployeeID", SqlDbType.NVarChar).Value = employeeId;
                    await connection.OpenAsync();
                    var certificates = new List<Dictionary<string, object>>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var certificate = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                certificate[columnName] = value;
                            }
                            certificates.Add(certificate);
                        }
                    }

                    if (certificates.Count == 0)
                        return NotFound(new { message = $"No sick leave certificates found for EmployeeID {employeeId}." });

                    return Ok(certificates);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = $"A database error occurred while retrieving sick leave certificates for EmployeeID {employeeId}.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An error occurred while retrieving sick leave certificates for EmployeeID {employeeId}.", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Dictionary<string, object>>> GetSickLeaveCertificate(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid Certificate ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_SickLeaveCertificates WHERE CertificateID = @CertificateID", connection))
                {
                    command.Parameters.Add("@CertificateID", SqlDbType.Int).Value = id;
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var certificate = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                certificate[columnName] = value;
                            }
                            return Ok(certificate);
                        }

                        return NotFound(new { message = "Sick leave certificate not found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the sick leave certificate.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the sick leave certificate.", error = ex.Message });
            }
        }


        [HttpPost]
        public async Task<ActionResult<SickLeaveCertificate>> CreateSickLeaveCertificate([FromBody] SickLeaveCertificate certificate)
        {
            if (certificate == null || string.IsNullOrWhiteSpace(certificate.DoctorName) ||
                string.IsNullOrWhiteSpace(certificate.EmployeeID) || certificate.StartDate == default || certificate.EndDate == default ||
                string.IsNullOrWhiteSpace(certificate.Diagnosis) || certificate.DoctorID == Guid.Empty ||
                string.IsNullOrWhiteSpace(certificate.PatientName) || certificate.CreatedBy == null)
            {
                return BadRequest(new { message = "Certificate data is incomplete. Required fields: PatientName, EmployeeID, StartDate, EndDate, Diagnosis, DoctorID, CreatedBy." });
            }

            if (certificate.EndDate < certificate.StartDate)
                return BadRequest(new { message = "EndDate must be on or after StartDate." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_CreateSickLeaveCertificate]", connection))
                {
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@EmployeeID", certificate.EmployeeID);
                        command.Parameters.AddWithValue("@PatientName", (object)certificate.PatientName ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Address", (object)certificate.Address ?? DBNull.Value);
                        command.Parameters.AddWithValue("@StartDate", certificate.StartDate);
                        command.Parameters.AddWithValue("@EndDate", certificate.EndDate);
                        command.Parameters.AddWithValue("@Diagnosis", certificate.Diagnosis);
                        command.Parameters.AddWithValue("@Recommendations", (object)certificate.Recommendations ?? DBNull.Value);
                        command.Parameters.AddWithValue("@DoctorID", certificate.DoctorID);
                        command.Parameters.AddWithValue("@DoctorName", (object)certificate.DoctorName ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Status", (object)certificate.Status ?? DBNull.Value);
                        command.Parameters.AddWithValue("@IssueDate", (object)certificate.IssueDate ?? DBNull.Value);
                        command.Parameters.AddWithValue("@CreatedBy", (object)certificate.CreatedBy ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Age", (object)certificate.Age ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Sex", (object)certificate.Sex ?? DBNull.Value);
                        command.Parameters.AddWithValue("@ExaminedOn", (object)certificate.ExaminedOn ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Signature", (object)certificate.Signature ?? DBNull.Value);
                        command.Parameters.AddWithValue("@PatientID", (object)certificate.PatientID ?? DBNull.Value);

                        await connection.OpenAsync();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                // Safely handle the CertificateID as a Decimal and convert to Int32
                                var certificateId = reader["CertificateID"];
                                certificate.CertificateID = Convert.ToInt32(certificateId);
                            }
                            else
                            {
                                throw new Exception("No CertificateID returned from the stored procedure.");
                            }
                        }

                        return CreatedAtAction(nameof(GetSickLeaveCertificate), new { id = certificate.CertificateID }, certificate);
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the sick leave certificate.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the sick leave certificate.", error = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateCertificateStatus(int id, [FromBody] StatusUpdateRequest request)
        {
            if (id <= 0 || request == null || string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { message = "Invalid Certificate ID or status data. Required fields: Status." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand(
                    @"UPDATE [CHMS].SickLeaveCertificates 
                      SET Status = @Status
                      WHERE CertificateID = @CertificateID", connection))
                {
                    command.Parameters.AddWithValue("@CertificateID", id);
                    command.Parameters.AddWithValue("@Status", request.Status);

                    await connection.OpenAsync();
                    var rowsAffected = await command.ExecuteNonQueryAsync();

                    if (rowsAffected == 0)
                        return NotFound(new { message = "Sick leave certificate not found." });

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while updating the certificate status.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the certificate status.", error = ex.Message });
            }
        }
    }

    public class StatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}