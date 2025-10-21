using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace CHMS_API.Controllers
{
    [Route("api/CHMS_Procedures")]
    [ApiController]
    public class CHMS_ProceduresController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_ProceduresController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        // =============================================
        // Wound Care Endpoints
        // =============================================

        [HttpPost("wound-care")]
        public async Task<IActionResult> CreateWoundCare([FromBody] WoundCareRequest request)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_CreateWoundCare", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@WoundCareNumber", request.WoundCareNumber);
                        command.Parameters.AddWithValue("@PatientID", request.PatientID);
                        command.Parameters.AddWithValue("@CardNumber", request.CardNumber);
                        command.Parameters.AddWithValue("@OrderingPhysicianID", request.OrderingPhysicianID);
                        command.Parameters.AddWithValue("@WoundType", request.WoundType);
                        command.Parameters.AddWithValue("@WoundLocation", request.WoundLocation);
                        command.Parameters.AddWithValue("@WoundSize", request.WoundSize);
                        command.Parameters.AddWithValue("@WoundDepth", request.WoundDepth);
                        command.Parameters.AddWithValue("@WoundCondition", request.WoundCondition);
                        command.Parameters.AddWithValue("@TreatmentPlan", request.TreatmentPlan);
                        command.Parameters.AddWithValue("@DressingType", request.DressingType);
                        command.Parameters.AddWithValue("@CleaningSolution", request.CleaningSolution);
                        command.Parameters.AddWithValue("@Instructions", (object)request.Instructions ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Notes", (object)request.Notes ?? DBNull.Value);
                        command.Parameters.AddWithValue("@CreatedBy", request.CreatedBy);
                        command.Parameters.AddWithValue("@IsRecurring", request.IsRecurring);
                        command.Parameters.AddWithValue("@Frequency", (object)request.Frequency ?? DBNull.Value);
                        command.Parameters.AddWithValue("@TotalSessions", (object)request.TotalSessions ?? DBNull.Value);

                        var woundCareIDParam = new SqlParameter("@WoundCareID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(woundCareIDParam);

                        await command.ExecuteNonQueryAsync();

                        return Ok(new
                        {
                            woundCareID = woundCareIDParam.Value,
                            woundCareNumber = request.WoundCareNumber,
                            message = "Wound care procedure created successfully"
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("wound-care/patient/{patientId}")]
        public async Task<IActionResult> GetPatientWoundCare(int patientId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_GetPatientWoundCare", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PatientID", patientId);

                        var results = new List<Dictionary<string, object>>();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
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

        [HttpPut("wound-care/{id}/status")]
        public async Task<IActionResult> UpdateWoundCareStatus(int id, [FromBody] ProcedureStatusUpdate update)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_AdministerProcedure", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@ProcedureID", id);
                        command.Parameters.AddWithValue("@ProcedureType", "WoundCare");
                        command.Parameters.AddWithValue("@PerformedBy", update.PerformedBy);
                        command.Parameters.AddWithValue("@PerformedDate", update.PerformedDate);
                        command.Parameters.AddWithValue("@Notes", (object)update.Notes ?? DBNull.Value);

                        await command.ExecuteNonQueryAsync();
                        return Ok(new { message = "Wound care status updated successfully" });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // =============================================
        // Suturing Endpoints
        // =============================================

        [HttpPost("suturing")]
        public async Task<IActionResult> CreateSuturing([FromBody] SuturingRequest request)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_CreateSuturing", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@SuturingNumber", request.SuturingNumber);
                        command.Parameters.AddWithValue("@PatientID", request.PatientID);
                        command.Parameters.AddWithValue("@CardNumber", request.CardNumber);
                        command.Parameters.AddWithValue("@OrderingPhysicianID", request.OrderingPhysicianID);
                        command.Parameters.AddWithValue("@WoundType", request.WoundType);
                        command.Parameters.AddWithValue("@WoundLocation", request.WoundLocation);
                        command.Parameters.AddWithValue("@WoundSize", request.WoundSize);
                        command.Parameters.AddWithValue("@WoundDepth", request.WoundDepth);
                        command.Parameters.AddWithValue("@SutureType", request.SutureType);
                        command.Parameters.AddWithValue("@SutureMaterial", request.SutureMaterial);
                        command.Parameters.AddWithValue("@SutureSize", request.SutureSize);
                        command.Parameters.AddWithValue("@NumStitches", request.NumStitches);
                        command.Parameters.AddWithValue("@AnesthesiaUsed", (object)request.AnesthesiaUsed ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Instructions", (object)request.Instructions ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Notes", (object)request.Notes ?? DBNull.Value);
                        command.Parameters.AddWithValue("@CreatedBy", request.CreatedBy);
                        command.Parameters.AddWithValue("@FollowUpRequired", request.FollowUpRequired);
                        command.Parameters.AddWithValue("@FollowUpDate", (object)request.FollowUpDate ?? DBNull.Value);

                        var suturingIDParam = new SqlParameter("@SuturingID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(suturingIDParam);

                        await command.ExecuteNonQueryAsync();

                        return Ok(new
                        {
                            suturingID = suturingIDParam.Value,
                            suturingNumber = request.SuturingNumber,
                            message = "Suturing procedure created successfully"
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("suturing/patient/{patientId}")]
        public async Task<IActionResult> GetPatientSuturing(int patientId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_GetPatientSuturing", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PatientID", patientId);

                        var results = new List<Dictionary<string, object>>();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
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

        [HttpPut("suturing/{id}/status")]
        public async Task<IActionResult> UpdateSuturingStatus(int id, [FromBody] ProcedureStatusUpdate update)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_AdministerProcedure", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@ProcedureID", id);
                        command.Parameters.AddWithValue("@ProcedureType", "Suturing");
                        command.Parameters.AddWithValue("@PerformedBy", update.PerformedBy);
                        command.Parameters.AddWithValue("@PerformedDate", update.PerformedDate);
                        command.Parameters.AddWithValue("@Notes", (object)update.Notes ?? DBNull.Value);

                        await command.ExecuteNonQueryAsync();
                        return Ok(new { message = "Suturing status updated successfully" });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // =============================================
        // Ear Irrigation Endpoints
        // =============================================

        [HttpPost("ear-irrigation")]
        public async Task<IActionResult> CreateEarIrrigation([FromBody] EarIrrigationRequest request)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_CreateEarIrrigation", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@EarIrrigationNumber", request.EarIrrigationNumber);
                        command.Parameters.AddWithValue("@PatientID", request.PatientID);
                        command.Parameters.AddWithValue("@CardNumber", request.CardNumber);
                        command.Parameters.AddWithValue("@OrderingPhysicianID", request.OrderingPhysicianID);
                        command.Parameters.AddWithValue("@EarSide", request.EarSide);
                        command.Parameters.AddWithValue("@IrrigationSolution", request.IrrigationSolution);
                        command.Parameters.AddWithValue("@SolutionTemperature", request.SolutionTemperature);
                        command.Parameters.AddWithValue("@IrrigationPressure", request.IrrigationPressure);
                        command.Parameters.AddWithValue("@ProcedureDuration", request.ProcedureDuration);
                        command.Parameters.AddWithValue("@Findings", (object)request.Findings ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Complications", (object)request.Complications ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Instructions", (object)request.Instructions ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Notes", (object)request.Notes ?? DBNull.Value);
                        command.Parameters.AddWithValue("@CreatedBy", request.CreatedBy);
                        command.Parameters.AddWithValue("@FollowUpRequired", request.FollowUpRequired);
                        command.Parameters.AddWithValue("@FollowUpDate", (object)request.FollowUpDate ?? DBNull.Value);

                        var earIrrigationIDParam = new SqlParameter("@EarIrrigationID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(earIrrigationIDParam);

                        await command.ExecuteNonQueryAsync();

                        return Ok(new
                        {
                            earIrrigationID = earIrrigationIDParam.Value,
                            earIrrigationNumber = request.EarIrrigationNumber,
                            message = "Ear irrigation procedure created successfully"
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("ear-irrigation/patient/{patientId}")]
        public async Task<IActionResult> GetPatientEarIrrigation(int patientId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_GetPatientEarIrrigation", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PatientID", patientId);

                        var results = new List<Dictionary<string, object>>();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
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

        [HttpPut("ear-irrigation/{id}/status")]
        public async Task<IActionResult> UpdateEarIrrigationStatus(int id, [FromBody] ProcedureStatusUpdate update)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_AdministerProcedure", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@ProcedureID", id);
                        command.Parameters.AddWithValue("@ProcedureType", "EarIrrigation");
                        command.Parameters.AddWithValue("@PerformedBy", update.PerformedBy);
                        command.Parameters.AddWithValue("@PerformedDate", update.PerformedDate);
                        command.Parameters.AddWithValue("@Notes", (object)update.Notes ?? DBNull.Value);

                        await command.ExecuteNonQueryAsync();
                        return Ok(new { message = "Ear irrigation status updated successfully" });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // =============================================
        // Generic Procedure Endpoints
        // =============================================

        [HttpGet("today/pending")]
        public async Task<IActionResult> GetTodayPendingProcedures()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_GetTodayPendingProcedures", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        var results = new List<Dictionary<string, object>>();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
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

        [HttpPut("{procedureId}/administer")]
        public async Task<IActionResult> AdministerProcedure(int procedureId, [FromBody] AdministerProcedureRequest request)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_AdministerProcedure", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@ProcedureID", procedureId);
                        command.Parameters.AddWithValue("@ProcedureType", request.ProcedureType);
                        command.Parameters.AddWithValue("@PerformedBy", request.PerformedBy);
                        command.Parameters.AddWithValue("@PerformedDate", request.PerformedDate);
                        command.Parameters.AddWithValue("@Notes", (object)request.Notes ?? DBNull.Value);

                        await command.ExecuteNonQueryAsync();
                        return Ok(new { message = "Procedure administered successfully" });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }

    // Request Models
    public class WoundCareRequest
    {
        public string WoundCareNumber { get; set; }
        public int PatientID { get; set; }
        public string CardNumber { get; set; }
        public Guid OrderingPhysicianID { get; set; }
        public string WoundType { get; set; }
        public string WoundLocation { get; set; }
        public string WoundSize { get; set; }
        public string WoundDepth { get; set; }
        public string WoundCondition { get; set; }
        public string TreatmentPlan { get; set; }
        public string DressingType { get; set; }
        public string CleaningSolution { get; set; }
        public string Instructions { get; set; }
        public string Notes { get; set; }
        public Guid CreatedBy { get; set; }
        public bool IsRecurring { get; set; }
        public string Frequency { get; set; }
        public int? TotalSessions { get; set; }
    }

    public class SuturingRequest
    {
        public string SuturingNumber { get; set; }
        public int PatientID { get; set; }
        public string CardNumber { get; set; }
        public Guid OrderingPhysicianID { get; set; }
        public string WoundType { get; set; }
        public string WoundLocation { get; set; }
        public string WoundSize { get; set; }
        public string WoundDepth { get; set; }
        public string SutureType { get; set; }
        public string SutureMaterial { get; set; }
        public string SutureSize { get; set; }
        public int NumStitches { get; set; }
        public string AnesthesiaUsed { get; set; }
        public string Instructions { get; set; }
        public string Notes { get; set; }
        public Guid CreatedBy { get; set; }
        public bool FollowUpRequired { get; set; }
        public DateTime? FollowUpDate { get; set; }
    }

    public class EarIrrigationRequest
    {
        public string EarIrrigationNumber { get; set; }
        public int PatientID { get; set; }
        public string CardNumber { get; set; }
        public Guid OrderingPhysicianID { get; set; }
        public string EarSide { get; set; }
        public string IrrigationSolution { get; set; }
        public string SolutionTemperature { get; set; }
        public string IrrigationPressure { get; set; }
        public int ProcedureDuration { get; set; }
        public string Findings { get; set; }
        public string Complications { get; set; }
        public string Instructions { get; set; }
        public string Notes { get; set; }
        public Guid CreatedBy { get; set; }
        public bool FollowUpRequired { get; set; }
        public DateTime? FollowUpDate { get; set; }
    }

    public class ProcedureStatusUpdate
    {
        public string Status { get; set; }
        public Guid PerformedBy { get; set; }
        public DateTime PerformedDate { get; set; }
        public string Notes { get; set; }
    }

    public class AdministerProcedureRequest
    {
        public int ProcedureID { get; set; }
        public string ProcedureType { get; set; }
        public Guid PerformedBy { get; set; }
        public DateTime PerformedDate { get; set; }
        public string Notes { get; set; }
    }
}
