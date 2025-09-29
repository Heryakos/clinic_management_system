using HospitalManagementSystem.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using System.Linq;

namespace HospitalManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CHMS_PatientsController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_PatientsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        //[HttpGet]
        //public async Task<ActionResult<IEnumerable<PatientSummary>>> GetPatients([FromQuery] string cardNumber = null)
        //{
        //    try
        //    {
        //        using (var connection = new SqlConnection(_connectionString))
        //        {
        //            string query = "SELECT * FROM [CHMS].vw_PatientSummary";
        //            if (!string.IsNullOrEmpty(cardNumber))
        //                query += " WHERE CardNumber = @CardNumber";

        //            query += " ORDER BY RegistrationDate DESC";

        //            using (var command = new SqlCommand(query, connection))
        //            {
        //                if (!string.IsNullOrEmpty(cardNumber))
        //                    command.Parameters.AddWithValue("@CardNumber", cardNumber);

        //                await connection.OpenAsync();
        //                var patients = new List<PatientSummary>();

        //                using (var reader = await command.ExecuteReaderAsync())
        //                {
        //                    while (await reader.ReadAsync())
        //                    {
        //                        patients.Add(new PatientSummary
        //                        {
        //                            PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
        //                            CardNumber = reader.GetString(reader.GetOrdinal("CardNumber")),
        //                            FullName = reader.GetString(reader.GetOrdinal("FullName")),
        //                            FatherName = reader.IsDBNull(reader.GetOrdinal("FatherName")) ? null : reader.GetString(reader.GetOrdinal("FatherName")),
        //                            DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
        //                            Age = reader.GetInt32(reader.GetOrdinal("Age")),
        //                            Gender = reader.IsDBNull(reader.GetOrdinal("Gender")) ? '\0' : reader.GetString(reader.GetOrdinal("Gender"))[0],
        //                            Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? null : reader.GetString(reader.GetOrdinal("Phone")),
        //                            Address = reader.IsDBNull(reader.GetOrdinal("Address")) ? null : reader.GetString(reader.GetOrdinal("Address")),
        //                            BloodType = reader.IsDBNull(reader.GetOrdinal("BloodType")) ? null : reader.GetString(reader.GetOrdinal("BloodType")),
        //                            TotalVisits = reader.GetInt32(reader.GetOrdinal("TotalVisits")),
        //                            LastDiagnosis = reader.IsDBNull(reader.GetOrdinal("LastDiagnosis")) ? null : reader.GetString(reader.GetOrdinal("LastDiagnosis")),
        //                            LastVisitDate = reader.IsDBNull(reader.GetOrdinal("LastVisitDate")) ? null : (DateTime?)reader.GetDateTime(reader.GetOrdinal("LastVisitDate")),
        //                            RegistrationDate = reader.GetDateTime(reader.GetOrdinal("RegistrationDate")),
        //                            // New properties below
        //                            SupervisorApproval = reader.IsDBNull(reader.GetOrdinal("SupervisorApproval")) ? (bool?)null : reader.GetBoolean(reader.GetOrdinal("SupervisorApproval")),
        //                            EmployeeID = reader.IsDBNull(reader.GetOrdinal("EmployeeID")) ? null : reader.GetString(reader.GetOrdinal("EmployeeID")),
        //                            Photo = reader.IsDBNull(reader.GetOrdinal("Photo")) ? null : (byte[])reader["Photo"],
        //                            RequestType = reader.IsDBNull(reader.GetOrdinal("RequestType")) ? null : reader.GetString(reader.GetOrdinal("RequestType")),
        //                            RequestNumber = reader.IsDBNull(reader.GetOrdinal("RequestNumber")) ? null : reader.GetString(reader.GetOrdinal("RequestNumber")),
        //                            RoomType = reader.IsDBNull(reader.GetOrdinal("RoomType")) ? null : reader.GetString(reader.GetOrdinal("RoomType")),
        //                            RoomNumber = reader.IsDBNull(reader.GetOrdinal("RoomNumber")) ? null : reader.GetString(reader.GetOrdinal("RoomNumber")),
        //                            StaffUserID = reader.IsDBNull(reader.GetOrdinal("StaffUserID")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("StaffUserID")),
        //                        });
        //                    }
        //                }

        //                return Ok(patients);
        //            }
        //        }
        //    }
        //    catch (SqlException ex)
        //    {
        //        return StatusCode(500, new { message = "A database error occurred while retrieving patients.", error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "An error occurred while retrieving patients.", error = ex.Message });
        //    }
        //}

        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetActivePatients()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    string query = "SELECT * FROM [CHMS].[vw_ActivePatients]";
                    //if (!string.IsNullOrEmpty(cardNumber))
                    //    query += " WHERE CardNumber = @CardNumber";
                    //query += " ORDER BY RegistrationDate DESC";

                    using (var command = new SqlCommand(query, connection))
                    {
                        //if (!string.IsNullOrEmpty(cardNumber))
                        //    command.Parameters.AddWithValue("@CardNumber", cardNumber);

                        await connection.OpenAsync();
                        var patients = new List<Dictionary<string, object>>();

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var patient = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    string columnName = reader.GetName(i);
                                    object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    patient[columnName] = value;
                                }
                                patients.Add(patient);
                            }
                        }

                        return Ok(patients);
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving patients.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving patients.", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetPatients([FromQuery] string cardNumber = null)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    string query = "SELECT * FROM [CHMS].vw_PatientSummary";
                    if (!string.IsNullOrEmpty(cardNumber))
                        query += " WHERE CardNumber = @CardNumber";
                    query += " ORDER BY RegistrationDate DESC";

                    using (var command = new SqlCommand(query, connection))
                    {
                        if (!string.IsNullOrEmpty(cardNumber))
                            command.Parameters.AddWithValue("@CardNumber", cardNumber);

                        await connection.OpenAsync();
                        var patients = new List<Dictionary<string, object>>();

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var patient = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    string columnName = reader.GetName(i);
                                    object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    patient[columnName] = value;
                                }
                                patients.Add(patient);
                            }
                        }

                        return Ok(patients);
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving patients.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving patients.", error = ex.Message });
            }
        }

        //[HttpGet("{id}")]
        //public async Task<ActionResult<Patient>> GetPatient(string id)
        //{
        //    if (string.IsNullOrWhiteSpace(id))
        //        return BadRequest(new { message = "Card number is required." });
        //    try
        //    {
        //        using (var connection = new SqlConnection(_connectionString))
        //        using (var command = new SqlCommand("CHMS.GetActivePatientWithRoomByCard", connection))
        //        {
        //            command.CommandType = CommandType.StoredProcedure;
        //            command.Parameters.Add("@CardNumber", SqlDbType.NVarChar, 50).Value = id;
        //            //command.Parameters.Add("@RoomName", SqlDbType.NVarChar, 100).Value = "Laboratory Room 1";
        //            await connection.OpenAsync();
        //            using (var reader = await command.ExecuteReaderAsync())
        //            {
        //                if (await reader.ReadAsync())
        //                {
        //                    var patient = new Patient
        //                    {
        //                        PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
        //                        CardNumber = reader.GetString(reader.GetOrdinal("CardNumber")),
        //                        FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
        //                        LastName = reader.GetString(reader.GetOrdinal("LastName")),
        //                        FatherName = reader.IsDBNull(reader.GetOrdinal("FatherName")) ? null : reader.GetString(reader.GetOrdinal("FatherName")),
        //                        GrandFatherName = reader.IsDBNull(reader.GetOrdinal("GrandFatherName")) ? null : reader.GetString(reader.GetOrdinal("GrandFatherName")),
        //                        DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
        //                        Age = reader.GetInt32(reader.GetOrdinal("Age")),
        //                        Gender = reader.IsDBNull(reader.GetOrdinal("Gender")) ? '\0' : reader.GetString(reader.GetOrdinal("Gender"))[0],
        //                        Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? null : reader.GetString(reader.GetOrdinal("Phone")),
        //                        Address = reader.IsDBNull(reader.GetOrdinal("Address")) ? null : reader.GetString(reader.GetOrdinal("Address")),
        //                        Region = reader.IsDBNull(reader.GetOrdinal("Region")) ? null : reader.GetString(reader.GetOrdinal("Region")),
        //                        SubCity = reader.IsDBNull(reader.GetOrdinal("SubCity")) ? null : reader.GetString(reader.GetOrdinal("SubCity")),
        //                        Woreda = reader.IsDBNull(reader.GetOrdinal("Woreda")) ? null : reader.GetString(reader.GetOrdinal("Woreda")),
        //                        HouseNumber = reader.IsDBNull(reader.GetOrdinal("HouseNumber")) ? null : reader.GetString(reader.GetOrdinal("HouseNumber")),
        //                        EmergencyContact = reader.IsDBNull(reader.GetOrdinal("EmergencyContact")) ? null : reader.GetString(reader.GetOrdinal("EmergencyContact")),
        //                        EmergencyPhone = reader.IsDBNull(reader.GetOrdinal("EmergencyPhone")) ? null : reader.GetString(reader.GetOrdinal("EmergencyPhone")),
        //                        BloodType = reader.IsDBNull(reader.GetOrdinal("BloodType")) ? null : reader.GetString(reader.GetOrdinal("BloodType")),
        //                        Allergies = reader.IsDBNull(reader.GetOrdinal("Allergies")) ? null : reader.GetString(reader.GetOrdinal("Allergies")),
        //                        MedicalHistory = reader.IsDBNull(reader.GetOrdinal("MedicalHistory")) ? null : reader.GetString(reader.GetOrdinal("MedicalHistory")),
        //                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
        //                        RegistrationDate = reader.GetDateTime(reader.GetOrdinal("RegistrationDate")),
        //                        CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("CreatedBy")),
        //                        RoomName = reader.IsDBNull(reader.GetOrdinal("RoomName")) ? null : reader.GetString(reader.GetOrdinal("RoomName"))
        //                    };
        //                    return Ok(patient);
        //                }
        //                return NotFound(new { message = "Patient not found." });
        //            }
        //        }
        //    }
        //    catch (SqlException ex)
        //    {
        //        return StatusCode(500, new { message = "A database error occurred while retrieving the patient.", error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "An error occurred while retrieving the patient.", error = ex.Message });
        //    }
        //}

        [HttpGet("{id}")]
        public async Task<ActionResult<Dictionary<string, object>>> GetPatient(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest(new { message = "Card number is required." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("CHMS.GetActivePatientWithRoomByCard", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@CardNumber", SqlDbType.NVarChar, -1).Value = id;

                    await connection.OpenAsync();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var patient = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                patient[columnName] = value;
                            }
                            return Ok(patient);
                        }
                        return NotFound(new { message = "Patient not found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the patient.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the patient.", error = ex.Message });
            }
        }


        //[HttpGet("all")]
        //public async Task<ActionResult<IEnumerable<Patient>>> GetAllActivePatients()
        //{
        //    try
        //    {
        //        using (var connection = new SqlConnection(_connectionString))
        //        using (var command = new SqlCommand("SELECT * FROM [CHMS].Patients WHERE IsActive = 1", connection))
        //        {
        //            await connection.OpenAsync();
        //            var patients = new List<Patient>();

        //            using (var reader = await command.ExecuteReaderAsync())
        //            {
        //                while (await reader.ReadAsync())
        //                {
        //                    patients.Add(new Patient
        //                    {
        //                        PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
        //                        CardNumber = reader.GetString(reader.GetOrdinal("CardNumber")),
        //                        FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
        //                        LastName = reader.GetString(reader.GetOrdinal("LastName")),
        //                        FatherName = reader.IsDBNull(reader.GetOrdinal("FatherName")) ? null : reader.GetString(reader.GetOrdinal("FatherName")),
        //                        GrandFatherName = reader.IsDBNull(reader.GetOrdinal("GrandFatherName")) ? null : reader.GetString(reader.GetOrdinal("GrandFatherName")),
        //                        DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
        //                        Age = reader.GetInt32(reader.GetOrdinal("Age")),
        //                        Gender = reader.IsDBNull(reader.GetOrdinal("Gender")) ? '\0' : reader.GetString(reader.GetOrdinal("Gender"))[0],
        //                        Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? null : reader.GetString(reader.GetOrdinal("Phone")),
        //                        Address = reader.IsDBNull(reader.GetOrdinal("Address")) ? null : reader.GetString(reader.GetOrdinal("Address")),
        //                        Region = reader.IsDBNull(reader.GetOrdinal("Region")) ? null : reader.GetString(reader.GetOrdinal("Region")),
        //                        SubCity = reader.IsDBNull(reader.GetOrdinal("SubCity")) ? null : reader.GetString(reader.GetOrdinal("SubCity")),
        //                        Woreda = reader.IsDBNull(reader.GetOrdinal("Woreda")) ? null : reader.GetString(reader.GetOrdinal("Woreda")),
        //                        HouseNumber = reader.IsDBNull(reader.GetOrdinal("HouseNumber")) ? null : reader.GetString(reader.GetOrdinal("HouseNumber")),
        //                        EmergencyContact = reader.IsDBNull(reader.GetOrdinal("EmergencyContact")) ? null : reader.GetString(reader.GetOrdinal("EmergencyContact")),
        //                        EmergencyPhone = reader.IsDBNull(reader.GetOrdinal("EmergencyPhone")) ? null : reader.GetString(reader.GetOrdinal("EmergencyPhone")),
        //                        BloodType = reader.IsDBNull(reader.GetOrdinal("BloodType")) ? null : reader.GetString(reader.GetOrdinal("BloodType")),
        //                        Allergies = reader.IsDBNull(reader.GetOrdinal("Allergies")) ? null : reader.GetString(reader.GetOrdinal("Allergies")),
        //                        MedicalHistory = reader.IsDBNull(reader.GetOrdinal("MedicalHistory")) ? null : reader.GetString(reader.GetOrdinal("MedicalHistory")),
        //                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
        //                        RegistrationDate = reader.GetDateTime(reader.GetOrdinal("RegistrationDate")),
        //                        CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("CreatedBy"))
        //                    });
        //                }
        //            }

        //            return Ok(patients);
        //        }
        //    }
        //    catch (SqlException ex)
        //    {
        //        return StatusCode(500, new { message = "A database error occurred while retrieving active patients.", error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "An error occurred while retrieving active patients.", error = ex.Message });
        //    }
        //}

        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetAllActivePatients()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    string query = "SELECT * FROM [CHMS].vw_PatientSummary WHERE IS_Active = 1 AND SupervisorApproval = 1 ORDER BY RegistrationDate DESC";

                    using (var command = new SqlCommand(query, connection))
                    {
                        await connection.OpenAsync();
                        var patients = new List<Dictionary<string, object>>();

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                var patient = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    string columnName = reader.GetName(i);
                                    object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    patient[columnName] = value;
                                }
                                patients.Add(patient);
                            }
                        }

                        return Ok(patients);
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving active patients.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving active patients.", error = ex.Message });
            }
        }

        //[HttpGet("cards/{cardId}")]
        //public async Task<ActionResult<PatientCard>> GetPatientCard(int cardId)
        //{
        //    if (cardId <= 0)
        //        return BadRequest(new { message = "Invalid Card ID." });

        //    try
        //    {
        //        using (var connection = new SqlConnection(_connectionString))
        //        using (var command = new SqlCommand("SELECT * FROM [CHMS].PatientCards WHERE CardID = @CardID AND IsActive = 1", connection))
        //        {
        //            command.Parameters.Add("@CardID", SqlDbType.Int).Value = cardId;
        //            await connection.OpenAsync();

        //            using (var reader = await command.ExecuteReaderAsync())
        //            {
        //                if (await reader.ReadAsync())
        //                {
        //                    var card = new PatientCard
        //                    {
        //                        CardID = reader.GetInt32(reader.GetOrdinal("CardID")),
        //                        PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
        //                        VisitDate = reader.GetDateTime(reader.GetOrdinal("VisitDate")),
        //                        Weight = reader.IsDBNull(reader.GetOrdinal("Weight")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("Weight")),
        //                        Height = reader.IsDBNull(reader.GetOrdinal("Height")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("Height")),
        //                        BMI = reader.IsDBNull(reader.GetOrdinal("BMI")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("BMI")),
        //                        BloodPressure = reader.IsDBNull(reader.GetOrdinal("BloodPressure")) ? null : reader.GetString(reader.GetOrdinal("BloodPressure")),
        //                        Temperature = reader.IsDBNull(reader.GetOrdinal("Temperature")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("Temperature")),
        //                        PulseRate = reader.IsDBNull(reader.GetOrdinal("PulseRate")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("PulseRate")),
        //                        ChiefComplaint = reader.IsDBNull(reader.GetOrdinal("ChiefComplaint")) ? null : reader.GetString(reader.GetOrdinal("ChiefComplaint")),
        //                        ClinicalFindings = reader.IsDBNull(reader.GetOrdinal("ClinicalFindings")) ? null : reader.GetString(reader.GetOrdinal("ClinicalFindings")),
        //                        Diagnosis = reader.IsDBNull(reader.GetOrdinal("Diagnosis")) ? null : reader.GetString(reader.GetOrdinal("Diagnosis")),
        //                        TreatmentPlan = reader.IsDBNull(reader.GetOrdinal("TreatmentPlan")) ? null : reader.GetString(reader.GetOrdinal("TreatmentPlan")),
        //                        DoctorID = reader.IsDBNull(reader.GetOrdinal("DoctorID")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("DoctorID")),
        //                        NextAppointment = reader.IsDBNull(reader.GetOrdinal("NextAppointment")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("NextAppointment")),
        //                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
        //                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
        //                        AssignedRoom = reader.IsDBNull(reader.GetOrdinal("AssignedRoom")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("AssignedRoom")),
        //                        RequestType = reader.IsDBNull(reader.GetOrdinal("RequestType")) ? null : reader.GetString(reader.GetOrdinal("RequestType")),
        //                        CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("CreatedBy")),
        //                        ModifiedBy = reader.IsDBNull(reader.GetOrdinal("ModifiedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("ModifiedBy")),
        //                        ModifiedDate = reader.IsDBNull(reader.GetOrdinal("ModifiedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ModifiedDate"))
        //                    };

        //                    return Ok(card);
        //                }

        //                return NotFound(new { message = "Patient card not found." });
        //            }
        //        }
        //    }
        //    catch (SqlException ex)
        //    {
        //        return StatusCode(500, new { message = "A database error occurred while retrieving the patient card.", error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "An error occurred while retrieving the patient card.", error = ex.Message });
        //    }
        //}
        [HttpGet("cards/{cardId}")]
        public async Task<ActionResult<Dictionary<string, object>>> GetPatientCard(int cardId)
        {
            if (cardId <= 0)
                return BadRequest(new { message = "Invalid Card ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].PatientCards WHERE CardID = @CardID AND IsActive = 1", connection))
                {
                    command.Parameters.Add("@CardID", SqlDbType.Int).Value = cardId;

                    await connection.OpenAsync();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var card = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                card[columnName] = value;
                            }
                            return Ok(card);
                        }
                        return NotFound(new { message = "Patient card not found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the patient card.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the patient card.", error = ex.Message });
            }
        }
        //[HttpGet("cards/patient/{patientId}")]
        //public async Task<ActionResult<IEnumerable<PatientCard>>> GetPatientCardsByPatient(int patientId)
        //{
        //    if (patientId <= 0)
        //        return BadRequest(new { message = "Invalid Patient ID." });

        //    try
        //    {
        //        using (var connection = new SqlConnection(_connectionString))
        //        using (var command = new SqlCommand("SELECT * FROM [CHMS].PatientCards WHERE PatientID = @PatientID AND IsActive = 1", connection))
        //        {
        //            command.Parameters.Add("@PatientID", SqlDbType.Int).Value = patientId;
        //            await connection.OpenAsync();
        //            var cards = new List<PatientCard>();

        //            using (var reader = await command.ExecuteReaderAsync())
        //            {
        //                while (await reader.ReadAsync())
        //                {
        //                    cards.Add(new PatientCard
        //                    {
        //                        CardID = reader.GetInt32(reader.GetOrdinal("CardID")),
        //                        PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
        //                        VisitDate = reader.GetDateTime(reader.GetOrdinal("VisitDate")),
        //                        Weight = reader.IsDBNull(reader.GetOrdinal("Weight")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("Weight")),
        //                        Height = reader.IsDBNull(reader.GetOrdinal("Height")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("Height")),
        //                        BMI = reader.IsDBNull(reader.GetOrdinal("BMI")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("BMI")),
        //                        BloodPressure = reader.IsDBNull(reader.GetOrdinal("BloodPressure")) ? null : reader.GetString(reader.GetOrdinal("BloodPressure")),
        //                        Temperature = reader.IsDBNull(reader.GetOrdinal("Temperature")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("Temperature")),
        //                        PulseRate = reader.IsDBNull(reader.GetOrdinal("PulseRate")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("PulseRate")),
        //                        ChiefComplaint = reader.IsDBNull(reader.GetOrdinal("ChiefComplaint")) ? null : reader.GetString(reader.GetOrdinal("ChiefComplaint")),
        //                        ClinicalFindings = reader.IsDBNull(reader.GetOrdinal("ClinicalFindings")) ? null : reader.GetString(reader.GetOrdinal("ClinicalFindings")),
        //                        Diagnosis = reader.IsDBNull(reader.GetOrdinal("Diagnosis")) ? null : reader.GetString(reader.GetOrdinal("Diagnosis")),
        //                        TreatmentPlan = reader.IsDBNull(reader.GetOrdinal("TreatmentPlan")) ? null : reader.GetString(reader.GetOrdinal("TreatmentPlan")),
        //                        DoctorID = reader.IsDBNull(reader.GetOrdinal("DoctorID")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("DoctorID")),
        //                        NextAppointment = reader.IsDBNull(reader.GetOrdinal("NextAppointment")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("NextAppointment")),
        //                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
        //                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
        //                        AssignedRoom = reader.IsDBNull(reader.GetOrdinal("AssignedRoom")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("AssignedRoom")),
        //                        RequestType = reader.IsDBNull(reader.GetOrdinal("RequestType")) ? null : reader.GetString(reader.GetOrdinal("RequestType")),
        //                        CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("CreatedBy")),
        //                        ModifiedBy = reader.IsDBNull(reader.GetOrdinal("ModifiedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("ModifiedBy")),
        //                        ModifiedDate = reader.IsDBNull(reader.GetOrdinal("ModifiedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ModifiedDate"))
        //                    });
        //                }
        //            }

        //            return Ok(cards);
        //        }
        //    }
        //    catch (SqlException ex)
        //    {
        //        return StatusCode(500, new { message = "A database error occurred while retrieving patient cards.", error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "An error occurred while retrieving patient cards.", error = ex.Message });
        //    }
        //}
        [HttpGet("cards/patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetPatientCardsByPatient(int patientId)
        {
            if (patientId <= 0)
                return BadRequest(new { message = "Invalid Patient ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].PatientCards WHERE PatientID = @PatientID AND IsActive = 1", connection))
                {
                    command.Parameters.Add("@PatientID", SqlDbType.Int).Value = patientId;

                    await connection.OpenAsync();
                    var cards = new List<Dictionary<string, object>>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var card = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                card[columnName] = value;
                            }
                            cards.Add(card);
                        }
                    }

                    return Ok(cards);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving patient cards.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving patient cards.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Patient>> CreatePatient([FromBody] Patient patient)
        {
            //if (patient == null || string.IsNullOrWhiteSpace(patient.CardNumber) ||
            //    string.IsNullOrWhiteSpace(patient.FirstName) || string.IsNullOrWhiteSpace(patient.LastName) ||
            //    patient.DateOfBirth == default || patient.Gender == '\0' || patient.CreatedBy == null)
            //{
            //    return BadRequest(new { message = "Patient data is incomplete. Required fields: CardNumber, FirstName, LastName, DateOfBirth, Gender, CreatedBy." });
            //}

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_RegisterPatient", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@CardNumber", SqlDbType.NVarChar).Value = patient.CardNumber;
                    command.Parameters.Add("@FirstName", SqlDbType.NVarChar).Value = patient.FirstName;
                    command.Parameters.Add("@LastName", SqlDbType.NVarChar).Value = patient.LastName;
                    command.Parameters.Add("@FatherName", SqlDbType.NVarChar).Value = (object?)patient.FatherName ?? DBNull.Value;
                    command.Parameters.Add("@GrandFatherName", SqlDbType.NVarChar).Value = (object?)patient.GrandFatherName ?? DBNull.Value;
                    command.Parameters.Add("@DateOfBirth", SqlDbType.DateTime).Value = patient.DateOfBirth;
                    command.Parameters.Add("@Gender", SqlDbType.NChar, 1).Value = patient.Gender.ToString();
                    command.Parameters.Add("@Phone", SqlDbType.NVarChar).Value = (object?)patient.Phone ?? DBNull.Value;
                    command.Parameters.Add("@Address", SqlDbType.NVarChar).Value = (object?)patient.Address ?? DBNull.Value;
                    command.Parameters.Add("@Region", SqlDbType.NVarChar).Value = (object?)patient.Region ?? DBNull.Value;
                    command.Parameters.Add("@SubCity", SqlDbType.NVarChar).Value = (object?)patient.SubCity ?? DBNull.Value;
                    command.Parameters.Add("@Woreda", SqlDbType.NVarChar).Value = (object?)patient.Woreda ?? DBNull.Value;
                    command.Parameters.Add("@HouseNumber", SqlDbType.NVarChar).Value = (object?)patient.HouseNumber ?? DBNull.Value;
                    command.Parameters.Add("@EmergencyContact", SqlDbType.NVarChar).Value = (object?)patient.EmergencyContact ?? DBNull.Value;
                    command.Parameters.Add("@EmergencyPhone", SqlDbType.NVarChar).Value = (object?)patient.EmergencyPhone ?? DBNull.Value;
                    command.Parameters.Add("@BloodType", SqlDbType.NVarChar).Value = (object?)patient.BloodType ?? DBNull.Value;
                    command.Parameters.Add("@Allergies", SqlDbType.NVarChar).Value = (object?)patient.Allergies ?? DBNull.Value;
                    command.Parameters.Add("@MedicalHistory", SqlDbType.NVarChar).Value = (object?)patient.MedicalHistory ?? DBNull.Value;
                    command.Parameters.Add("@CreatedBy", SqlDbType.UniqueIdentifier).Value = patient.CreatedBy;
                    var patientIdParam = new SqlParameter("@PatientID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(patientIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    patient.PatientID = (int)patientIdParam.Value;
                    return CreatedAtAction(nameof(GetPatient), new { id = patient.CardNumber }, patient);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the patient.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the patient.", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(int id, [FromBody] Patient patient)
        {
            //if (id <= 0 || patient == null || string.IsNullOrWhiteSpace(patient.FirstName) ||
            //    string.IsNullOrWhiteSpace(patient.LastName) || patient.DateOfBirth == default ||
            //    patient.Gender == '\0')
            //{
            //    return BadRequest(new
            //    {
            //        message = "Invalid Patient ID or patient data. Required fields: FirstName, LastName, DateOfBirth, Gender."
            //    });
            //}

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[PatientDoctorUpdate]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@PatientID", SqlDbType.Int).Value = id;
                    command.Parameters.Add("@FirstName", SqlDbType.NVarChar).Value = patient.FirstName;
                    command.Parameters.Add("@LastName", SqlDbType.NVarChar).Value = patient.LastName;
                    command.Parameters.Add("@FatherName", SqlDbType.NVarChar).Value = (object?)patient.FatherName ?? DBNull.Value;
                    command.Parameters.Add("@GrandFatherName", SqlDbType.NVarChar).Value = (object?)patient.GrandFatherName ?? DBNull.Value;
                    command.Parameters.Add("@DateOfBirth", SqlDbType.DateTime).Value = patient.DateOfBirth;
                    command.Parameters.Add("@Gender", SqlDbType.NChar, 1).Value = patient.Gender.ToString();
                    command.Parameters.Add("@Phone", SqlDbType.NVarChar).Value = (object?)patient.Phone ?? DBNull.Value;
                    command.Parameters.Add("@Address", SqlDbType.NVarChar).Value = (object?)patient.Address ?? DBNull.Value;
                    command.Parameters.Add("@Region", SqlDbType.NVarChar).Value = (object?)patient.Region ?? DBNull.Value;
                    command.Parameters.Add("@SubCity", SqlDbType.NVarChar).Value = (object?)patient.SubCity ?? DBNull.Value;
                    command.Parameters.Add("@Woreda", SqlDbType.NVarChar).Value = (object?)patient.Woreda ?? DBNull.Value;
                    command.Parameters.Add("@HouseNumber", SqlDbType.NVarChar).Value = (object?)patient.HouseNumber ?? DBNull.Value;
                    command.Parameters.Add("@EmergencyContact", SqlDbType.NVarChar).Value = (object?)patient.EmergencyContact ?? DBNull.Value;
                    command.Parameters.Add("@EmergencyPhone", SqlDbType.NVarChar).Value = (object?)patient.EmergencyPhone ?? DBNull.Value;
                    command.Parameters.Add("@BloodType", SqlDbType.NVarChar).Value = (object?)patient.BloodType ?? DBNull.Value;
                    command.Parameters.Add("@Allergies", SqlDbType.NVarChar).Value = (object?)patient.Allergies ?? DBNull.Value;
                    command.Parameters.Add("@MedicalHistory", SqlDbType.NVarChar).Value = (object?)patient.MedicalHistory ?? DBNull.Value;
                    command.Parameters.Add("@CreatedBy", SqlDbType.UniqueIdentifier).Value = patient.CreatedBy;

                    command.Parameters.Add("@ClinicalFindings", SqlDbType.NVarChar).Value = (object?)patient.ClinicalFindings ?? DBNull.Value;
                    command.Parameters.Add("@ChiefComplaint", SqlDbType.NVarChar).Value = (object?)patient.ChiefComplaint ?? DBNull.Value;
                    command.Parameters.Add("@PulseRate", SqlDbType.NVarChar).Value = (object?)patient.PulseRate ?? DBNull.Value;
                    command.Parameters.Add("@Temperature", SqlDbType.NVarChar).Value = (object?)patient.Temperature ?? DBNull.Value;
                    command.Parameters.Add("@BloodPressure", SqlDbType.NVarChar).Value = (object?)patient.BloodPressure ?? DBNull.Value;
                    command.Parameters.Add("@BMI", SqlDbType.NVarChar).Value = (object?)patient.BMI ?? DBNull.Value;
                    command.Parameters.Add("@Height", SqlDbType.NVarChar).Value = (object?)patient.Height ?? DBNull.Value;
                    command.Parameters.Add("@Weight", SqlDbType.NVarChar).Value = (object?)patient.Weight ?? DBNull.Value;
                    command.Parameters.Add("@VisitDate", SqlDbType.DateTime).Value = (object?)patient.VisitDate ?? DBNull.Value;
                    command.Parameters.Add("@NextAppointment", SqlDbType.DateTime).Value = (object?)patient.NextAppointment ?? DBNull.Value;
                    command.Parameters.Add("@TreatmentPlan", SqlDbType.NVarChar).Value = (object?)patient.TreatmentPlan ?? DBNull.Value;


                    await connection.OpenAsync();
                    var rowsAffected = await command.ExecuteNonQueryAsync();

                    if (rowsAffected == 0)
                        return NotFound(new { message = "Patient not found." });

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while updating the patient.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the patient.", error = ex.Message });
            }
        }

        [HttpPut("cards/{cardId}")]
        public async Task<IActionResult> UpdatePatientCard(int cardId, [FromBody] PatientCard card)
        {
            //if (cardId <= 0 || card == null || card.PatientID <= 0)
            //{
            //    return BadRequest(new { message = "Invalid Card ID or card data. Required fields: PatientID." });
            //}

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_UpdatePatientCard]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@CardID", SqlDbType.Int).Value = cardId;
                    command.Parameters.Add("@PatientID", SqlDbType.Int).Value = card.PatientID;
                    command.Parameters.Add("@Weight", SqlDbType.Decimal).Value = (object?)card.Weight ?? DBNull.Value;
                    command.Parameters.Add("@Height", SqlDbType.Decimal).Value = (object?)card.Height ?? DBNull.Value;
                    command.Parameters.Add("@BloodPressure", SqlDbType.NVarChar).Value = (object?)card.BloodPressure ?? DBNull.Value;
                    command.Parameters.Add("@Temperature", SqlDbType.Decimal).Value = (object?)card.Temperature ?? DBNull.Value;
                    command.Parameters.Add("@PulseRate", SqlDbType.Int).Value = (object?)card.PulseRate ?? DBNull.Value;
                    command.Parameters.Add("@ChiefComplaint", SqlDbType.NVarChar).Value = (object?)card.ChiefComplaint ?? DBNull.Value;
                    command.Parameters.Add("@ClinicalFindings", SqlDbType.NVarChar).Value = (object?)card.ClinicalFindings ?? DBNull.Value;
                    command.Parameters.Add("@Diagnosis", SqlDbType.NVarChar).Value = (object?)card.Diagnosis ?? DBNull.Value;
                    command.Parameters.Add("@TreatmentPlan", SqlDbType.NVarChar).Value = (object?)card.TreatmentPlan ?? DBNull.Value;
                    command.Parameters.Add("@DoctorID", SqlDbType.UniqueIdentifier).Value = (object?)card.DoctorID ?? DBNull.Value;
                    command.Parameters.Add("@NextAppointment", SqlDbType.DateTime2).Value = (object?)card.NextAppointment ?? DBNull.Value;
                    command.Parameters.Add("@ModifiedBy", SqlDbType.UniqueIdentifier).Value = (object?)card.ModifiedBy ?? DBNull.Value;

                    await connection.OpenAsync();
                    var rowsAffected = await command.ExecuteNonQueryAsync();

                    if (rowsAffected == 0)
                        return NotFound(new { message = "Patient card not found." });

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while updating the patient card.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the patient card.", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid Patient ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("UPDATE [CHMS].Patients SET IsActive = 0 WHERE PatientID = @PatientID", connection))
                {
                    command.Parameters.Add("@PatientID", SqlDbType.Int).Value = id;
                    await connection.OpenAsync();
                    var rowsAffected = await command.ExecuteNonQueryAsync();

                    if (rowsAffected == 0)
                        return NotFound(new { message = "Patient not found." });

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while deleting the patient.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the patient.", error = ex.Message });
            }
        }
    }
}