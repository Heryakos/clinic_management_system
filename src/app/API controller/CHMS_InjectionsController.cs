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
    public class CHMS_InjectionsController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_InjectionsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpPost]
        public async Task<ActionResult<Injection>> CreateInjection([FromBody] Injection injection)
        {
            if (injection == null || string.IsNullOrWhiteSpace(injection.InjectionNumber) ||
                injection.PatientID <= 0 || injection.OrderingPhysician == Guid.Empty ||
                injection.MedicationID <= 0 || string.IsNullOrWhiteSpace(injection.Dose) ||
                injection.CreatedBy == null)
            {
                return BadRequest(new { message = "Injection data is incomplete. Required fields: InjectionNumber, PatientID, OrderingPhysician, MedicationID, Dose, CreatedBy." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_CreateInjection]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@InjectionNumber", SqlDbType.NVarChar).Value = injection.InjectionNumber;
                    command.Parameters.Add("@PatientID", SqlDbType.Int).Value = injection.PatientID;
                    command.Parameters.Add("@CardNumber", SqlDbType.NVarChar).Value = injection.CardNumber;
                    command.Parameters.Add("@OrderingPhysician", SqlDbType.UniqueIdentifier).Value = injection.OrderingPhysician;
                    command.Parameters.Add("@MedicationID", SqlDbType.Int).Value = injection.MedicationID;
                    command.Parameters.Add("@Dose", SqlDbType.NVarChar).Value = injection.Dose;
                    command.Parameters.Add("@Notes", SqlDbType.NVarChar).Value = (object?)injection.Notes ?? DBNull.Value;
                    command.Parameters.Add("@CreatedBy", SqlDbType.UniqueIdentifier).Value = injection.CreatedBy;
                    var injectionIdParam = new SqlParameter("@InjectionID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(injectionIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    injection.InjectionID = (int)injectionIdParam.Value;
                    return CreatedAtAction(nameof(GetInjection), new { id = injection.InjectionID }, injection);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the injection.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the injection.", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Injection>> GetInjection(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid Injection ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].Injections WHERE InjectionID = @InjectionID", connection))
                {
                    command.Parameters.Add("@InjectionID", SqlDbType.Int).Value = id;
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var injection = new Injection
                            {
                                InjectionID = reader.GetInt32(reader.GetOrdinal("InjectionID")),
                                InjectionNumber = reader.GetString(reader.GetOrdinal("InjectionNumber")),
                                PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
                                CardNumber = reader.GetString(reader.GetOrdinal("CardNumber")),
                                OrderingPhysician = reader.GetGuid(reader.GetOrdinal("OrderingPhysician")),
                                MedicationID = reader.GetInt32(reader.GetOrdinal("MedicationID")),
                                Dose = reader.GetString(reader.GetOrdinal("Dose")),
                                AdministrationDate = reader.IsDBNull(reader.GetOrdinal("AdministrationDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("AdministrationDate")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                Notes = reader.IsDBNull(reader.GetOrdinal("Notes")) ? null : reader.GetString(reader.GetOrdinal("Notes")),
                                AdministeredBy = reader.IsDBNull(reader.GetOrdinal("AdministeredBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("AdministeredBy")),
                                CreatedBy = reader.GetGuid(reader.GetOrdinal("CreatedBy"))
                            };

                            return Ok(injection);
                        }

                        return NotFound(new { message = "Injection not found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the injection.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the injection.", error = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateInjectionStatus(int id, [FromBody] InjectionStatusUpdate update)
        {
            if (id <= 0 || update == null || string.IsNullOrWhiteSpace(update.Status) || update.AdministeredBy == null)
                return BadRequest(new { message = "Invalid Injection ID or status data. Required fields: Status, AdministeredBy." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_UpdateInjectionStatus]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@InjectionID", SqlDbType.Int).Value = id;
                    command.Parameters.Add("@Status", SqlDbType.NVarChar).Value = update.Status;
                    command.Parameters.Add("@AdministeredBy", SqlDbType.UniqueIdentifier).Value = update.AdministeredBy;
                    command.Parameters.Add("@AdministrationDate", SqlDbType.DateTime2).Value = (object?)update.AdministrationDate ?? DBNull.Value;

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while updating the injection status.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the injection status.", error = ex.Message });
            }
        }
    }

    public class Injection
    {
        public int InjectionID { get; set; }
        public string InjectionNumber { get; set; }
        public int PatientID { get; set; }
        public string CardNumber { get; set; }
        public Guid OrderingPhysician { get; set; }
        public int MedicationID { get; set; }
        public string Dose { get; set; }
        public DateTime? AdministrationDate { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public Guid? AdministeredBy { get; set; }
        public Guid CreatedBy { get; set; }
    }

    public class InjectionStatusUpdate
    {
        public string Status { get; set; }
        public Guid AdministeredBy { get; set; }
        public DateTime? AdministrationDate { get; set; }
    }
}