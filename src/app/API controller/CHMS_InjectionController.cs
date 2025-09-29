using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;


namespace CHMS_API.Controllers
{
    [Route("api/CHMS_Injection")]
    [ApiController]
    public class CHMS_InjectionController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_InjectionController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpPost("injections")]
        public async Task<IActionResult> CreateInjection([FromBody] InjectionModel model)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_CreateInjection", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@InjectionNumber", model.InjectionNumber);
                        command.Parameters.AddWithValue("@PatientID", model.PatientID);
                        command.Parameters.AddWithValue("@CardID", (object)model.CardID ?? DBNull.Value);
                        command.Parameters.AddWithValue("@OrderingPhysicianID", model.OrderingPhysicianID);
                        command.Parameters.AddWithValue("@MedicationID", model.MedicationID);
                        command.Parameters.AddWithValue("@Dose", model.Dose);
                        command.Parameters.AddWithValue("@Route", model.Route);
                        command.Parameters.AddWithValue("@Site", model.Site);
                        command.Parameters.AddWithValue("@Frequency", model.Frequency);
                        command.Parameters.AddWithValue("@Duration", model.Duration);
                        command.Parameters.AddWithValue("@Instructions", (object)model.Instructions ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Notes", (object)model.Notes ?? DBNull.Value);
                        command.Parameters.AddWithValue("@CreatedBy", model.CreatedBy);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                return Ok(new
                                {
                                    injectionID = reader.GetInt32("InjectionID"),
                                    injectionNumber = reader.GetString("InjectionNumber"),
                                    patientID = reader.GetInt32("PatientID"),
                                    injectionDate = reader.GetDateTime("InjectionDate"),
                                    status = reader.GetString("Status")
                                });
                            }
                        }
                    }
                }
                return StatusCode(500, new { message = "Failed to create injection." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetPatientInjections(int patientId)
        {
            try
            {
                var injections = new List<object>();
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_GetPatientInjections", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PatientID", patientId);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                injections.Add(new
                                {
                                    injectionID = reader.GetInt32("InjectionID"),
                                    injectionNumber = reader.GetString("InjectionNumber"),
                                    injectionDate = reader.GetDateTime("InjectionDate"),
                                    status = reader.GetString("Status"),
                                    orderingPhysicianID = reader.IsDBNull(reader.GetOrdinal("orderingPhysicianID")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("orderingPhysicianID")),
                                    orderingPhysicianName = reader.GetString("OrderingPhysicianName"),
                                    medicationID = reader.GetInt32("MedicationID"),
                                    medicationName = reader.GetString("MedicationName"),
                                    strength = reader.GetString("Strength"),
                                    dosageForm = reader.GetString("DosageForm"),
                                    dose = reader.GetString("Dose"),
                                    route = reader.GetString("Route"),
                                    site = reader.GetString("Site"),
                                    frequency = reader.GetString("Frequency"),
                                    duration = reader.GetString("Duration"),
                                    instructions = reader.IsDBNull("Instructions") ? null : reader.GetString("Instructions"),
                                    AdministeredBy = reader.IsDBNull(reader.GetOrdinal("AdministeredBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("AdministeredBy")),
                                    administeredByName = reader.IsDBNull("AdministeredByName") ? null : reader.GetString("AdministeredByName"),
                                    administeredDate = reader.IsDBNull(reader.GetOrdinal("administeredDate")) ? null : (DateTime?)reader.GetDateTime(reader.GetOrdinal("administeredDate")),
                                    notes = reader.IsDBNull("Notes") ? null : reader.GetString("Notes")
                                });
                            }
                        }
                    }
                }
                return Ok(injections);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("injections/{injectionId}/administer")]
        public async Task<IActionResult> AdministerInjection(int injectionId, [FromBody] AdministerModel model)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_AdministerInjection", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@InjectionID", injectionId);
                        command.Parameters.AddWithValue("@NurseID", model.NurseID);

                        await command.ExecuteNonQueryAsync();
                        return Ok(new { message = "Injection administered successfully" });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }

    public class InjectionModel
    {
        public string InjectionNumber { get; set; }
        public int PatientID { get; set; }
        public int? CardID { get; set; }
        public Guid OrderingPhysicianID { get; set; }
        public int MedicationID { get; set; }
        public string Dose { get; set; }
        public string Route { get; set; }
        public string Site { get; set; }
        public string Frequency { get; set; }
        public string Duration { get; set; }
        public string Instructions { get; set; }
        public string Notes { get; set; }
        public Guid CreatedBy { get; set; }
    }

    public class AdministerModel
    {
        public Guid NurseID { get; set; }
    }
}