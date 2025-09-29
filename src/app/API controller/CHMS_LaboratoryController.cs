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
    public class CHMS_LaboratoryController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_LaboratoryController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet("tests/card/{cardNumber}")]
        public async Task<IActionResult> GetTestsByCardNumber(string cardNumber)
        {
            if (string.IsNullOrWhiteSpace(cardNumber))
                return BadRequest(new { message = "Card number is required." });

            try
            {
                var tests = new List<LaboratoryTestModel>();
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("SELECT * FROM [CHMS].LaboratoryTests WHERE CardNumber = @CardNumber", connection))
                    {
                        command.Parameters.AddWithValue("@CardNumber", cardNumber);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                tests.Add(new LaboratoryTestModel
                                {
                                    TestID = reader.GetInt32(reader.GetOrdinal("TestID")),
                                    TestNumber = reader.GetString(reader.GetOrdinal("TestNumber")),
                                    PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
                                    CardID = reader.IsDBNull(reader.GetOrdinal("CardID")) ? null : reader.GetString(reader.GetOrdinal("CardID")),
                                    CardNumber = reader.IsDBNull(reader.GetOrdinal("CardNumber")) ? null : reader.GetString(reader.GetOrdinal("CardNumber")),
                                    OrderingPhysician = reader.GetGuid(reader.GetOrdinal("OrderingPhysician")).ToString(),
                                    TestCategory = reader.GetString(reader.GetOrdinal("TestCategory")),
                                    TestDate = reader.GetDateTime(reader.GetOrdinal("TestDate")),
                                    Priority = reader.GetString(reader.GetOrdinal("Priority")),
                                    ClinicalNotes = reader.IsDBNull(reader.GetOrdinal("ClinicalNotes")) ? null : reader.GetString(reader.GetOrdinal("ClinicalNotes")),
                                    Status = reader.GetString(reader.GetOrdinal("Status"))
                                });
                            }
                        }
                    }
                }

                return Ok(tests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("tests/{testId}/details")]
        public async Task<ActionResult<IEnumerable<LaboratoryTestDetail>>> GetTestDetails(int testId)
        {
            if (testId <= 0)
                return BadRequest(new { message = "Invalid Test ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].LaboratoryTestDetails WHERE TestID = @TestID", connection))
                {
                    command.Parameters.Add("@TestID", SqlDbType.Int).Value = testId;
                    await connection.OpenAsync();
                    var details = new List<LaboratoryTestDetail>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            details.Add(new LaboratoryTestDetail
                            {
                                DetailID = reader.GetInt32(reader.GetOrdinal("DetailID")),
                                TestID = reader.GetInt32(reader.GetOrdinal("TestID")),
                                TestName = reader.GetString(reader.GetOrdinal("TestName")),
                                Result = reader.IsDBNull(reader.GetOrdinal("Result")) ? null : reader.GetString(reader.GetOrdinal("Result")),
                                NormalRange = reader.IsDBNull(reader.GetOrdinal("NormalRange")) ? null : reader.GetString(reader.GetOrdinal("NormalRange")),
                                Unit = reader.IsDBNull(reader.GetOrdinal("Unit")) ? null : reader.GetString(reader.GetOrdinal("Unit")),
                                IsAbnormal = reader.GetBoolean(reader.GetOrdinal("IsAbnormal")),
                                Comments = reader.IsDBNull(reader.GetOrdinal("Comments")) ? null : reader.GetString(reader.GetOrdinal("Comments"))
                            });
                        }
                    }

                    return Ok(details);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving test details.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving test details.", error = ex.Message });
            }
        }
        [HttpGet("tests/patient/{patientId}")]
        public async Task<IActionResult> GetPatientLaboratoryTests(int patientId)
        {
            try
            {
                var tests = new List<LaboratoryTestModel>();
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_GetPatientLaboratoryTests", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@PatientID", patientId);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                tests.Add(new LaboratoryTestModel
                                {
                                    TestID = reader.GetInt32("TestID"),
                                    TestNumber = reader.GetString("TestNumber"),
                                    TestCategory = reader.GetString("TestCategory"),
                                    TestDate = reader.GetDateTime("TestDate"),
                                    CardNumber = reader.IsDBNull(reader.GetOrdinal("CardNumber")) ? null : reader.GetString(reader.GetOrdinal("CardNumber")),
                                    Priority = reader.GetString("Priority"),
                                    ClinicalNotes = reader.IsDBNull("ClinicalNotes") ? null : reader.GetString("ClinicalNotes"),
                                    Status = reader.GetString("Status"),
                                    PatientName = reader.GetString("PatientName"),
                                    OrderingPhysicianName = reader.GetString("OrderingPhysicianName"),
                                    TechnicianName = reader.IsDBNull("TechnicianName") ? null : reader.GetString("TechnicianName"),
                                    ReportedByName = reader.IsDBNull("ReportedByName") ? null : reader.GetString("ReportedByName")
                                });
                            }
                        }
                    }
                }
                return Ok(tests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("tests")]
        public async Task<ActionResult<IEnumerable<LaboratoryTestView>>> GetLaboratoryTests([FromQuery] string cardNumber)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    var tests = new List<LaboratoryTestView>();

                    var query = "SELECT * FROM [CHMS].vw_LaboratoryTests";
                    if (!string.IsNullOrWhiteSpace(cardNumber))
                        query += " WHERE CardNumber = @CardNumber";

                    query += " ORDER BY TestDate DESC";

                    using (var command = new SqlCommand(query, connection))
                    {
                        if (!string.IsNullOrWhiteSpace(cardNumber))
                            command.Parameters.AddWithValue("@CardNumber", cardNumber);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                tests.Add(new LaboratoryTestView
                                {
                                    TestID = reader.GetInt32(reader.GetOrdinal("TestID")),
                                    TestNumber = reader.GetString(reader.GetOrdinal("TestNumber")),
                                    CardNumber = reader.GetString(reader.GetOrdinal("CardNumber")),
                                    PatientName = reader.GetString(reader.GetOrdinal("PatientName")),
                                    Age = reader.GetInt32(reader.GetOrdinal("Age")),
                                    Gender = reader.IsDBNull(reader.GetOrdinal("Gender")) ? '\0' : reader.GetString(reader.GetOrdinal("Gender"))[0],
                                    TestCategory = reader.GetString(reader.GetOrdinal("TestCategory")),
                                    TestDate = reader.GetDateTime(reader.GetOrdinal("TestDate")),
                                    SampleCollectionDate = reader.IsDBNull(reader.GetOrdinal("SampleCollectionDate")) ? null : (DateTime?)reader.GetDateTime(reader.GetOrdinal("SampleCollectionDate")),
                                    ResultDate = reader.IsDBNull(reader.GetOrdinal("ResultDate")) ? null : (DateTime?)reader.GetDateTime(reader.GetOrdinal("ResultDate")),
                                    Status = reader.GetString(reader.GetOrdinal("Status")),
                                    Priority = reader.GetString(reader.GetOrdinal("Priority")),
                                    OrderingPhysicianName = reader.GetString(reader.GetOrdinal("OrderingPhysicianName")),
                                    TechnicianName = reader.IsDBNull(reader.GetOrdinal("TechnicianName")) ? null : reader.GetString(reader.GetOrdinal("TechnicianName")),
                                    ReportedByName = reader.IsDBNull(reader.GetOrdinal("ReportedByName")) ? null : reader.GetString(reader.GetOrdinal("ReportedByName")),
                                    TestCount = reader.GetInt32(reader.GetOrdinal("TestCount")),
                                    AbnormalCount = reader.GetInt32(reader.GetOrdinal("AbnormalCount"))
                                });
                            }
                        }
                    }

                    return Ok(tests);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving laboratory tests.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving laboratory tests.", error = ex.Message });
            }
        }


        [HttpGet("tests/{id}")]
        public async Task<ActionResult<LaboratoryTest>> GetLaboratoryTest(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid Test ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].LaboratoryTests WHERE TestID = @TestID", connection))
                {
                    command.Parameters.Add("@TestID", SqlDbType.Int).Value = id;
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var test = new LaboratoryTest
                            {
                                TestID = reader.GetInt32(reader.GetOrdinal("TestID")),
                                TestNumber = reader.GetString(reader.GetOrdinal("TestNumber")),
                                PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
                                CardID = reader.IsDBNull(reader.GetOrdinal("CardID")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("CardID")),
                                OrderingPhysician = reader.GetInt32(reader.GetOrdinal("OrderingPhysician")),
                                TestCategory = reader.GetString(reader.GetOrdinal("TestCategory")),
                                TestDate = reader.GetDateTime(reader.GetOrdinal("TestDate")),
                                SampleCollectionDate = reader.IsDBNull(reader.GetOrdinal("SampleCollectionDate")) ? null : (DateTime?)reader.GetDateTime(reader.GetOrdinal("SampleCollectionDate")),
                                ResultDate = reader.IsDBNull(reader.GetOrdinal("ResultDate")) ? null : (DateTime?)reader.GetDateTime(reader.GetOrdinal("ResultDate")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                Priority = reader.GetString(reader.GetOrdinal("Priority")),
                                ClinicalNotes = reader.IsDBNull(reader.GetOrdinal("ClinicalNotes")) ? null : reader.GetString(reader.GetOrdinal("ClinicalNotes")),
                                TechnicianID = reader.IsDBNull(reader.GetOrdinal("TechnicianID")) ? null : (Guid?)reader.GetGuid(reader.GetOrdinal("TechnicianID")),
                                ReportedBy = reader.IsDBNull(reader.GetOrdinal("ReportedBy")) ? null : (Guid?)reader.GetGuid(reader.GetOrdinal("ReportedBy")),
                                VerifiedBy = reader.IsDBNull(reader.GetOrdinal("VerifiedBy")) ? null : (Guid?)reader.GetGuid(reader.GetOrdinal("VerifiedBy")),
                                CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? null : (Guid?)reader.GetGuid(reader.GetOrdinal("CreatedBy"))
                            };

                            return Ok(test);
                        }

                        return NotFound(new { message = "Laboratory test not found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the laboratory test.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the laboratory test.", error = ex.Message });
            }
        }

        [HttpPost("tests")]
        public async Task<IActionResult> CreateLaboratoryTest([FromBody] LaboratoryTestModel test)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_CreateLaboratoryTest", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@TestNumber", test.TestNumber);
                        command.Parameters.AddWithValue("@PatientID", test.PatientID);
                        command.Parameters.AddWithValue("@CardID", (object)test.CardID ?? DBNull.Value);
                        command.Parameters.AddWithValue("@CardNumber", (object)test.CardNumber ?? DBNull.Value);
                        command.Parameters.AddWithValue("@OrderingPhysician", Guid.Parse(test.OrderingPhysician));
                        command.Parameters.AddWithValue("@TestCategory", test.TestCategory);
                        command.Parameters.AddWithValue("@Priority", test.Priority ?? "Normal");
                        command.Parameters.AddWithValue("@ClinicalNotes", (object)test.ClinicalNotes ?? DBNull.Value);
                        command.Parameters.AddWithValue("@CreatedBy", Guid.Parse(test.CreatedBy));

                        var testId = await command.ExecuteScalarAsync();
                        return Ok(new { TestID = testId });
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

      

        [HttpPost("tests/{testId}/details")]
        public async Task<IActionResult> AddLaboratoryTestDetail(int testId, [FromBody] LaboratoryTestDetailModel detail)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("CHMS.sp_AddLaboratoryTestDetails", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@TestID", testId);
                        command.Parameters.AddWithValue("@TestName", detail.TestName);
                        command.Parameters.AddWithValue("@Result", (object)detail.Result ?? DBNull.Value);
                        command.Parameters.AddWithValue("@NormalRange", (object)detail.NormalRange ?? DBNull.Value);
                        command.Parameters.AddWithValue("@Unit", (object)detail.Unit ?? DBNull.Value);
                        command.Parameters.AddWithValue("@IsAbnormal", detail.IsAbnormal);
                        command.Parameters.AddWithValue("@Comments", (object)detail.Comments ?? DBNull.Value);

                        var detailId = await command.ExecuteScalarAsync();
                        return Ok(new { DetailID = detailId });
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
       
        public class LaboratoryTestModel
        {
            public int TestID { get; set; }
            public string TestNumber { get; set; }
            public int PatientID { get; set; }
            public string CardID { get; set; }
            public string CardNumber { get; set; }
            public string OrderingPhysician { get; set; }
            public string TestCategory { get; set; }
            public string Priority { get; set; }
            public string ClinicalNotes { get; set; }
            public string CreatedBy { get; set; }
            public string Status { get; set; }
            public string PatientName { get; set; }
            public string OrderingPhysicianName { get; set; }
            public string TechnicianName { get; set; }
            public string ReportedByName { get; set; }
            public DateTime TestDate { get; set; }
            //public List<LaboratoryTestDetailModel> Tests { get; set; }
        }

        public class LaboratoryTestDetailModel
        {
            public int TestID { get; set; }
            public string TestName { get; set; }
            public string Result { get; set; }
            public string NormalRange { get; set; }
            public string Unit { get; set; }
            public bool IsAbnormal { get; set; }
            public string Comments { get; set; }
        }
    }
}