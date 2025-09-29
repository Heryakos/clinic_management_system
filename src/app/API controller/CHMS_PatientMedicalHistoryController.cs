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
    public class CHMS_PatientMedicalHistoryController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_PatientMedicalHistoryController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet("{cardNumber}")]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetPatientMedicalHistory(string cardNumber)
        {
            if (string.IsNullOrWhiteSpace(cardNumber))
                return BadRequest(new { message = "Card number is required." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetPatientMedicalHistoryByCardNumber]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@CardNumber", SqlDbType.NVarChar, 50).Value = cardNumber;

                    await connection.OpenAsync();
                    var histories = new List<Dictionary<string, object>>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var history = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                history[columnName] = value;
                            }
                            histories.Add(history);
                        }
                    }

                    if (histories.Count == 0)
                        return NotFound(new { message = "No medical history found for the provided card number." });

                    return Ok(histories);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving patient medical history.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving patient medical history.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> InsertOrUpdatePatientMedicalHistory([FromBody] Dictionary<string, object> request)
        {
            if (!request.ContainsKey("CardNumber") || !request.ContainsKey("CreatedBy") ||
                string.IsNullOrWhiteSpace(request["CardNumber"]?.ToString()) ||
                string.IsNullOrWhiteSpace(request["CreatedBy"]?.ToString()))
            {
                return BadRequest(new { message = "CardNumber and CreatedBy are required." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_InsertOrUpdatePatientMedicalHistory]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@CardNumber", SqlDbType.NVarChar, 20).Value = request["CardNumber"];
                    command.Parameters.Add("@CreatedBy", SqlDbType.UniqueIdentifier).Value = Guid.Parse(request["CreatedBy"].ToString());

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while inserting or updating patient medical history.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while inserting or updating patient medical history.", error = ex.Message });
            }
        }
    }
}
