using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.Linq;

namespace YourNamespace.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CHMS_PharmacyController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_PharmacyController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet("prescriptions/cardnumber/{cardNumber}")]
        public async Task<IActionResult> GetPatientPrescriptionsByCardNumber(string cardNumber)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("[CHMS].[GetPatientPrescriptionByCardNumber]", connection);
                command.CommandType = System.Data.CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@CardNumber", cardNumber);

                var results = new List<Dictionary<string, object>>();

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var columnName = reader.GetName(i);
                        var value = await reader.IsDBNullAsync(i) ? null : reader.GetValue(i);
                        row[columnName] = value;
                    }

                    results.Add(row);
                }

                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
        // GET: api/CHMS_Pharmacy/prescriptions/payrole/{payroleNo}
        [HttpGet("prescriptions/payrole/{payroleNo}")]
        public async Task<IActionResult> GetPatientPrescriptionsByPayrole(string payroleNo)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_GetPatientPrescriptions", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PayroleNo", payroleNo);

                        var prescriptions = new List<object>();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                prescriptions.Add(new
                                {
                                    PrescriptionID = reader.GetInt32(0),
                                    PrescriptionNumber = reader.GetString(1),
                                    PrescriptionDate = reader.GetDateTime(2),
                                    TotalAmount = reader.IsDBNull(3) ? (decimal?)null : reader.GetDecimal(3),
                                    Status = reader.GetString(4),
                                    Notes = reader.IsDBNull(5) ? null : reader.GetString(5),
                                    PatientName = reader.GetString(6),
                                    PrescriberName = reader.GetString(7),
                                    PharmacistName = reader.IsDBNull(8) ? null : reader.GetString(8)
                                });
                            }
                        }

                        return Ok(prescriptions);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }


        // GET: api/CHMS_Pharmacy/prescriptions
        [HttpGet("prescriptions")]
        public async Task<IActionResult> GetPrescriptions()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("[CHMS].[sp_GetPatientPrescriptionsPatientId]", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;
                        var prescriptions = new List<object>();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                prescriptions.Add(new
                                {
                                    PrescriptionID = reader.GetInt32(0),
                                    PrescriptionNumber = reader.GetString(1),
                                    PrescriptionDate = reader.GetDateTime(2),
                                    TotalAmount = reader.IsDBNull(3) ? (decimal?)null : reader.GetDecimal(3),
                                    Status = reader.GetString(4),
                                    Notes = reader.IsDBNull(5) ? null : reader.GetString(5),
                                    PatientName = reader.GetString(6),
                                    PrescriberName = reader.GetString(7),
                                    PharmacistName = reader.IsDBNull(8) ? null : reader.GetString(8)
                                });
                            }
                        }
                        return Ok(prescriptions);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // GET: api/CHMS_Pharmacy/prescriptions/{prescriptionId}/details
        [HttpGet("prescriptions/{prescriptionId}/details")]
        public async Task<IActionResult> GetPrescriptionDetails(int prescriptionId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.GetPrescriptionDetailsByPrescriptionID", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PrescriptionID", prescriptionId);

                        var details = new List<object>();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                details.Add(new
                                {
                                    DetailID = reader.GetInt32(reader.GetOrdinal("DetailID")),
                                    PrescriptionID = reader.GetInt32(reader.GetOrdinal("PrescriptionID")),
                                    MedicationID = reader.GetInt32(reader.GetOrdinal("MedicationID")),
                                    Dose = reader.GetString(reader.GetOrdinal("Dose")),
                                    Frequency = reader.GetString(reader.GetOrdinal("Frequency")),
                                    Duration = reader.GetString(reader.GetOrdinal("Duration")),
                                    Quantity = reader.GetInt32(reader.GetOrdinal("Quantity")),
                                    UnitPrice = reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                                    TotalPrice = reader.GetDecimal(reader.GetOrdinal("TotalPrice")),
                                    Instructions = reader.IsDBNull(reader.GetOrdinal("Instructions")) ? null : reader.GetString(reader.GetOrdinal("Instructions")),
                                    IsDispensed = reader.IsDBNull(reader.GetOrdinal("IsDispensed")) ? (bool?)null : reader.GetBoolean(reader.GetOrdinal("IsDispensed")),
                                    DispensedQuantity = reader.IsDBNull(reader.GetOrdinal("DispensedQuantity")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("DispensedQuantity")),
                                    DispensedDate = reader.IsDBNull(reader.GetOrdinal("DispensedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("DispensedDate")),
                                    ModifiedBy = reader.IsDBNull(reader.GetOrdinal("ModifiedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("ModifiedBy")),
                                    ModifiedDate = reader.IsDBNull(reader.GetOrdinal("ModifiedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ModifiedDate"))
                                });
                            }
                        }

                        return Ok(details);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }


        // GET: api/CHMS_Pharmacy/prescriptions/patient/{patientId}
        [HttpGet("prescriptions/patient/{patientId}")]
        public async Task<IActionResult> GetPatientPrescriptions(int patientId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_GetPatientPrescriptions", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PatientID", patientId);
                        var prescriptions = new List<object>();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                prescriptions.Add(new
                                {
                                    PrescriptionID = reader.GetInt32(0),
                                    PrescriptionNumber = reader.GetString(1),
                                    PrescriptionDate = reader.GetDateTime(2),
                                    TotalAmount = reader.IsDBNull(3) ? (decimal?)null : reader.GetDecimal(3),
                                    Status = reader.GetString(4),
                                    Notes = reader.IsDBNull(5) ? null : reader.GetString(5),
                                    PatientName = reader.GetString(6),
                                    PrescriberName = reader.GetString(7),
                                    PharmacistName = reader.IsDBNull(8) ? null : reader.GetString(8)
                                });
                            }
                        }
                        return Ok(prescriptions);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // POST: api/CHMS_Pharmacy/prescriptions
        [HttpPost("prescriptions")]
        public async Task<IActionResult> CreatePrescription([FromBody] PrescriptionModel model)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_CreatePrescription", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PrescriptionNumber", model.PrescriptionNumber);
                        command.Parameters.AddWithValue("@PatientID", model.PatientID);
                        command.Parameters.AddWithValue("@CardID", model.CardID ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@PrescriberID", model.PrescriberID);
                        command.Parameters.AddWithValue("@Notes", model.Notes ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@CreatedBy", model.CreatedBy);

                        var prescriptionId = await command.ExecuteScalarAsync();
                        return Ok(new { PrescriptionID = prescriptionId });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // POST: api/CHMS_Pharmacy/prescriptions/{prescriptionId}/details
        [HttpPost("prescriptions/{prescriptionId}/details")]
        public async Task<IActionResult> AddPrescriptionDetail(int prescriptionId, [FromBody] PrescriptionDetailModel model)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_AddPrescriptionDetails", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PrescriptionID", prescriptionId);
                        command.Parameters.AddWithValue("@MedicationID", model.MedicationID);
                        command.Parameters.AddWithValue("@Dose", model.Dose);
                        command.Parameters.AddWithValue("@Frequency", model.Frequency);
                        command.Parameters.AddWithValue("@Duration", model.Duration);
                        command.Parameters.AddWithValue("@Quantity", model.Quantity);
                        command.Parameters.AddWithValue("@UnitPrice", model.UnitPrice);
                        command.Parameters.AddWithValue("@Instructions", model.Instructions ?? (object)DBNull.Value);

                        var detailId = await command.ExecuteScalarAsync();
                        return Ok(new { DetailID = detailId });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // GET: api/CHMS_Pharmacy/medications
        // GET: api/CHMS_Pharmacy/medications
        [HttpGet("medications")]
        public async Task<IActionResult> GetMedications()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("SELECT MedicationID, MedicationName, Strength, DosageForm, Category FROM CHMS.Medications WHERE IsActive = 1", connection))
                    {
                        var medications = new List<(int MedicationID, string MedicationName, string Strength, string DosageForm, string Category)>();
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                medications.Add((
                                    reader.GetInt32(0),
                                    reader.GetString(1),
                                    reader.IsDBNull(2) ? null : reader.GetString(2),
                                    reader.GetString(3),
                                    reader.GetString(4)
                                ));
                            }
                        }

                        // Transform the flat list into a hierarchical structure
                        var tree = medications
                            .GroupBy(m => m.Category)
                            .Select(c => new
                            {
                                category = c.Key,
                                dosageForms = c
                                    .GroupBy(m => m.DosageForm)
                                    .Select(d => new
                                    {
                                        form = d.Key,
                                        medications = d.Select(m => new
                                        {
                                            medicationID = m.MedicationID, // Include medicationID
                                            medicationName = m.MedicationName,
                                            strength = m.Strength // Include strength
                                        }).ToList()
                                    }).ToList()
                            }).ToList();

                        return Ok(tree);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
        [HttpGet("request-reasons")]
        public async Task<IActionResult> GetRequestReasons()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.GetRequestReasons", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;

                        var reasons = new List<(int ReasonID, string Category, string ReasonText, int DisplayOrder)>();

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                reasons.Add((
                                    reader.GetInt32(reader.GetOrdinal("ReasonID")),
                                    reader.GetString(reader.GetOrdinal("Category")),
                                    reader.GetString(reader.GetOrdinal("ReasonText")),
                                    reader.GetInt32(reader.GetOrdinal("DisplayOrder"))
                                ));
                            }
                        }

                        var grouped = reasons
                            .GroupBy(r => r.Category)
                            .Select(g => new
                            {
                                category = g.Key,
                                reasons = g.OrderBy(r => r.DisplayOrder).Select(r => new
                                {
                                    reasonID = r.ReasonID,
                                    reasonText = r.ReasonText
                                }).ToList()
                            }).ToList();

                        return Ok(grouped);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
        [HttpPost("request-reasons")]
        public async Task<IActionResult> InsertRequestReason([FromBody] RequestReasonModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Category) || string.IsNullOrWhiteSpace(model.ReasonText) || model.CreatedBy == Guid.Empty)
            {
                return BadRequest(new { message = "Category, ReasonText, and CreatedBy are required." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.InsertRequestReason", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;

                        command.Parameters.AddWithValue("@Category", model.Category);
                        command.Parameters.AddWithValue("@ReasonText", model.ReasonText);
                        command.Parameters.AddWithValue("@DisplayOrder", model.DisplayOrder ?? 1);
                        command.Parameters.AddWithValue("@CreatedBy", model.CreatedBy);

                        var newId = await command.ExecuteScalarAsync();
                        return Ok(new { reasonID = newId, message = "Request reason inserted successfully." });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }


        [HttpPost("medications")]
        public async Task<IActionResult> AddMedication([FromBody] MedicationModel model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest(new { message = "Medication data is required." });
                }

                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_AddMedication", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@MedicationName", model.MedicationName);
                        command.Parameters.AddWithValue("@GenericName", model.GenericName ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@Strength", model.Strength ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@DosageForm", model.DosageForm);
                        command.Parameters.AddWithValue("@Manufacturer", model.Manufacturer ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@Category", model.Category);
                        command.Parameters.AddWithValue("@UnitPrice", model.UnitPrice);
                        command.Parameters.AddWithValue("@IsActive", model.IsActive);

                        var newMedicationIdParam = new SqlParameter("@NewMedicationID", System.Data.SqlDbType.Int)
                        {
                            Direction = System.Data.ParameterDirection.Output
                        };
                        command.Parameters.Add(newMedicationIdParam);

                        await command.ExecuteNonQueryAsync();

                        var newMedicationId = (int)newMedicationIdParam.Value;
                        return Ok(new { MedicationID = newMedicationId, message = "Medication added successfully" });
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        //    [HttpPut("prescriptions/{prescriptionId}/dispense")]
        //    public async Task<IActionResult> DispensePrescription(int prescriptionId, [FromBody] DispenseModel model)
        //    {
        //        try
        //        {
        //            using (var connection = new SqlConnection(_connectionString))
        //            {
        //                await connection.OpenAsync();
        //                using (var command = new SqlCommand("CHMS.sp_DispensePrescription", connection))
        //                {
        //                    command.CommandType = System.Data.CommandType.StoredProcedure;
        //                    command.Parameters.AddWithValue("@PrescriptionID", prescriptionId);
        //                    command.Parameters.AddWithValue("@PharmacistID", model.PharmacistID);
        //                    await command.ExecuteNonQueryAsync();
        //                    return Ok(new { message = "Prescription dispensed successfully" });
        //                }
        //            }
        //        }
        //        catch (Exception ex)
        //        {
        //            return StatusCode(500, new { message = ex.Message });
        //        }
        //    }
        //}

        [HttpPut("prescriptions/{prescriptionId}/dispense")]
        public async Task<IActionResult> DispensePrescription(int prescriptionId, [FromBody] DispenseModel model)
        {
            try
            {
                if (model == null || model.PharmacistID == Guid.Empty)
                {
                    return BadRequest(new { message = "PharmacistID is required." });
                }

                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_DispensePrescription", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PrescriptionID", prescriptionId);
                        command.Parameters.AddWithValue("@PharmacistID", model.PharmacistID);
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                return Ok(new
                                {
                                    PrescriptionID = reader.GetInt32(0),
                                    PrescriptionNumber = reader.GetString(1),
                                    Status = reader.GetString(2),
                                    DispensedDate = reader.GetDateTime(3),
                                    PharmacistID = reader.GetGuid(4).ToString()
                                });
                            }
                            return NotFound(new { message = "Prescription not found or could not be dispensed." });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        public class DispenseModel
        {
            public Guid PharmacistID { get; set; }
        }

        public class PrescriptionModel
    {
        public string PrescriptionNumber { get; set; }
        public int PatientID { get; set; }
        public int? CardID { get; set; }
        public Guid PrescriberID { get; set; }
        public string Notes { get; set; }
        public Guid CreatedBy { get; set; }
        public List<PrescriptionDetailModel> Medications { get; set; }
    }

    public class PrescriptionDetailModel
    {
        public int MedicationID { get; set; }
        public string Dose { get; set; }
        public string Frequency { get; set; }
        public string Duration { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string Instructions { get; set; }
    }
        public class MedicationModel
        {
            public string MedicationName { get; set; }
            public string GenericName { get; set; }
            public string Strength { get; set; }
            public string DosageForm { get; set; }
            public string Manufacturer { get; set; }
            public string Category { get; set; }
            public decimal UnitPrice { get; set; }
            public bool IsActive { get; set; }
        }
        public class RequestReasonModel
        {
            public string Category { get; set; }
            public string ReasonText { get; set; }
            public int? DisplayOrder { get; set; }
            public Guid CreatedBy { get; set; }
        }


        //public class DispenseModel
        //{
        //    public Guid PharmacistID { get; set; }
        //}
    }
}