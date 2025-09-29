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
    public class CHMS_PatientAssignmentsController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_PatientAssignmentsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        //[HttpGet]
        //public async Task<ActionResult<IEnumerable<PatientAssignment>>> GetPatientAssignments()
        //{
        //    try
        //    {
        //        using (var connection = new SqlConnection(_connectionString))
        //        using (var command = new SqlCommand("SELECT * FROM [CHMS].PatientAssignments WHERE IsActive = 1 ORDER BY AssignmentDate DESC", connection))
        //        {
        //            await connection.OpenAsync();
        //            var assignments = new List<PatientAssignment>();

        //            using (var reader = await command.ExecuteReaderAsync())
        //            {
        //                while (await reader.ReadAsync())
        //                {
        //                    assignments.Add(new PatientAssignment
        //                    {
        //                        AssignmentID = reader.GetInt32(reader.GetOrdinal("AssignmentID")),
        //                        CardID = reader.GetInt32(reader.GetOrdinal("CardID")),
        //                        PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
        //                        AssignedRoom = reader.GetInt32(reader.GetOrdinal("AssignedRoom")),
        //                        DoctorID = reader.GetGuid(reader.GetOrdinal("DoctorID")),
        //                        AssignedBy = reader.GetGuid(reader.GetOrdinal("AssignedBy")),
        //                        AssignmentDate = reader.GetDateTime(reader.GetOrdinal("AssignmentDate")),
        //                        Status = reader.GetString(reader.GetOrdinal("Status")),
        //                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
        //                    });
        //                }
        //            }

        //            return Ok(assignments);
        //        }
        //    }
        //    catch (SqlException ex)
        //    {
        //        return StatusCode(500, new { message = "A database error occurred while retrieving patient assignments.", error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "An error occurred while retrieving patient assignments.", error = ex.Message });
        //    }
        //}
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetPatientAssignments()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].PatientAssignments WHERE IsActive = 1 ORDER BY AssignmentDate DESC", connection))
                {
                    await connection.OpenAsync();
                    var assignments = new List<Dictionary<string, object>>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var assignment = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                assignment[columnName] = value;
                            }
                            assignments.Add(assignment);
                        }
                    }

                    return Ok(assignments);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving patient assignments.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving patient assignments.", error = ex.Message });
            }
        }
        //[HttpGet("rooms")]
        //public async Task<ActionResult<IEnumerable<Room>>> GetRooms()
        //{
        //    try
        //    {
        //        using (var connection = new SqlConnection(_connectionString))
        //        using (var command = new SqlCommand("[CHMS].[sp_GetStaffRolesAndRooms]", connection))
        //        {
        //            await connection.OpenAsync();
        //            var rooms = new List<Room>();

        //            using (var reader = await command.ExecuteReaderAsync())
        //            {
        //                while (await reader.ReadAsync())
        //                {
        //                    rooms.Add(new Room
        //                    {
        //                        RoomID = reader.GetInt32(reader.GetOrdinal("RoomID")),
        //                        RoomNumber = reader.GetString(reader.GetOrdinal("RoomNumber")),
        //                        RoomName = reader.GetString(reader.GetOrdinal("RoomName")),
        //                        RoomType = reader.GetString(reader.GetOrdinal("RoomType")),
        //                        Department = reader.IsDBNull(reader.GetOrdinal("Department")) ? null : reader.GetString(reader.GetOrdinal("Department")),
        //                        UserName = reader.IsDBNull(reader.GetOrdinal("UserName")) ? null : reader.GetString(reader.GetOrdinal("UserName")),
        //                        FName = reader.IsDBNull(reader.GetOrdinal("FName")) ? null : reader.GetString(reader.GetOrdinal("FName")),
        //                        MName = reader.IsDBNull(reader.GetOrdinal("MName")) ? null : reader.GetString(reader.GetOrdinal("MName")),
        //                        RoleName = reader.IsDBNull(reader.GetOrdinal("RoleName")) ? null : reader.GetString(reader.GetOrdinal("RoleName")),
        //                        Capacity = reader.IsDBNull(reader.GetOrdinal("Capacity")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("Capacity")),
        //                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
        //                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
        //                        CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("CreatedBy")),
        //                        UserID = reader.IsDBNull(reader.GetOrdinal("UserID")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("UserID"))

        //                    });
        //                }
        //            }

        //            return Ok(rooms);
        //        }
        //    }
        //    catch (SqlException ex)
        //    {
        //        return StatusCode(500, new { message = "A database error occurred while retrieving rooms.", error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "An error occurred while retrieving rooms.", error = ex.Message });
        //    }
        //}
        [HttpGet("rooms")]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetRooms()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetStaffRolesAndRooms]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    await connection.OpenAsync();
                    var rooms = new List<Dictionary<string, object>>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var room = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                room[columnName] = value;
                            }
                            rooms.Add(room);
                        }
                    }

                    return Ok(rooms);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving rooms.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving rooms.", error = ex.Message });
            }
        }
        [HttpGet("items/by-room/{roomId}")]
        public async Task<ActionResult<IEnumerable<InventoryItem>>> GetInventoryItemsByRoom(Guid roomId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetInventoryItemsByRoom]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RoomID", SqlDbType.UniqueIdentifier).Value = roomId;
                    await connection.OpenAsync();
                    var items = new List<InventoryItem>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            items.Add(new InventoryItem
                            {
                                ItemID = reader.GetInt32(reader.GetOrdinal("ItemID")),
                                ItemCode = reader.GetString(reader.GetOrdinal("ItemCode")),
                                ItemName = reader.GetString(reader.GetOrdinal("ItemName")),
                                CategoryID = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                                Unit = reader.GetString(reader.GetOrdinal("Unit")),
                                CurrentStock = reader.GetInt32(reader.GetOrdinal("CurrentStock")),
                                MinimumStock = reader.GetInt32(reader.GetOrdinal("MinimumStock")),
                                MaximumStock = reader.IsDBNull(reader.GetOrdinal("MaximumStock")) ? (int?)null: reader.GetInt32(reader.GetOrdinal("MaximumStock")),
                                UnitPrice = reader.IsDBNull(reader.GetOrdinal("UnitPrice"))? (decimal?)null: reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                                ExpiryDate = reader.IsDBNull(reader.GetOrdinal("ExpiryDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ExpiryDate")),
                                Manufacturer = reader.IsDBNull(reader.GetOrdinal("Manufacturer")) ? null : reader.GetString(reader.GetOrdinal("Manufacturer")),
                                BatchNumber = reader.IsDBNull(reader.GetOrdinal("BatchNumber")) ? null : reader.GetString(reader.GetOrdinal("BatchNumber")),
                                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                                UpdatedDate = reader.GetDateTime(reader.GetOrdinal("UpdatedDate"))
                            });
                        }
                    }

                    return Ok(items);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving inventory items by room.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving inventory items by room.", error = ex.Message });
            }
        }
        //[HttpGet("{id}")]
        //public async Task<ActionResult<PatientAssignment>> GetPatientAssignment(int id)
        //{
        //    if (id <= 0)
        //        return BadRequest(new { message = "Invalid Assignment ID." });

        //    try
        //    {
        //        using (var connection = new SqlConnection(_connectionString))
        //        using (var command = new SqlCommand("SELECT * FROM [CHMS].PatientAssignments WHERE AssignmentID = @AssignmentID AND IsActive = 1", connection))
        //        {
        //            command.Parameters.Add("@AssignmentID", SqlDbType.Int).Value = id;
        //            await connection.OpenAsync();

        //            using (var reader = await command.ExecuteReaderAsync())
        //            {
        //                if (await reader.ReadAsync())
        //                {
        //                    var assignment = new PatientAssignment
        //                    {
        //                        AssignmentID = reader.GetInt32(reader.GetOrdinal("AssignmentID")),
        //                        CardID = reader.GetInt32(reader.GetOrdinal("CardID")),
        //                        PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
        //                        AssignedRoom = reader.GetInt32(reader.GetOrdinal("AssignedRoom")),
        //                        DoctorID = reader.GetGuid(reader.GetOrdinal("DoctorID")),
        //                        AssignedBy = reader.GetGuid(reader.GetOrdinal("AssignedBy")),
        //                        AssignmentDate = reader.GetDateTime(reader.GetOrdinal("AssignmentDate")),
        //                        Status = reader.GetString(reader.GetOrdinal("Status")),
        //                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
        //                    };

        //                    return Ok(assignment);
        //                }

        //                return NotFound(new { message = "Patient assignment not found." });
        //            }
        //        }
        //    }
        //    catch (SqlException ex)
        //    {
        //        return StatusCode(500, new { message = "A database error occurred while retrieving the patient assignment.", error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "An error occurred while retrieving the patient assignment.", error = ex.Message });
        //    }
        //}
        [HttpGet("{id}")]
        public async Task<ActionResult<Dictionary<string, object>>> GetPatientAssignment(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid Assignment ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].PatientAssignments WHERE AssignmentID = @AssignmentID AND IsActive = 1", connection))
                {
                    command.Parameters.Add("@AssignmentID", SqlDbType.Int).Value = id;
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var assignment = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                assignment[columnName] = value;
                            }
                            return Ok(assignment);
                        }

                        return NotFound(new { message = "Patient assignment not found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the patient assignment.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the patient assignment.", error = ex.Message });
            }
        }

        //[HttpGet("history/{cardNumber}")]
        //public async Task<ActionResult<IEnumerable<PatientHistory>>> GetPatientHistoryByCardNumber(string cardNumber)
        //{
        //    if (string.IsNullOrWhiteSpace(cardNumber))
        //        return BadRequest(new { message = "Invalid Card Number." });

        //    try
        //    {
        //        using (var connection = new SqlConnection(_connectionString))
        //        using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_PatientHistory WHERE CardNumber = @CardNumber", connection))
        //        {
        //            command.Parameters.Add("@CardNumber", SqlDbType.VarChar).Value = cardNumber;
        //            await connection.OpenAsync();
        //            var history = new List<PatientHistory>();

        //            using (var reader = await command.ExecuteReaderAsync())
        //            {
        //                while (await reader.ReadAsync())
        //                {
        //                    history.Add(new PatientHistory
        //                    {
        //                        PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
        //                        CardNumber = reader.GetString(reader.GetOrdinal("CardNumber")),
        //                        FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
        //                        LastName = reader.GetString(reader.GetOrdinal("LastName")),
        //                        Gender = reader.GetString(reader.GetOrdinal("Gender"))[0],
        //                        DateOfBirth = reader.GetDateTime(reader.GetOrdinal("DateOfBirth")),
        //                        CardID = reader.IsDBNull(reader.GetOrdinal("CardID")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("CardID")),
        //                        VisitDate = reader.IsDBNull(reader.GetOrdinal("VisitDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("VisitDate")),
        //                        RequestType = reader.IsDBNull(reader.GetOrdinal("RequestType")) ? null : reader.GetString(reader.GetOrdinal("RequestType")),
        //                        ChiefComplaint = reader.IsDBNull(reader.GetOrdinal("ChiefComplaint")) ? null : reader.GetString(reader.GetOrdinal("ChiefComplaint")),
        //                        Diagnosis = reader.IsDBNull(reader.GetOrdinal("Diagnosis")) ? null : reader.GetString(reader.GetOrdinal("Diagnosis")),
        //                        TreatmentPlan = reader.IsDBNull(reader.GetOrdinal("TreatmentPlan")) ? null : reader.GetString(reader.GetOrdinal("TreatmentPlan")),
        //                        RoomID = reader.IsDBNull(reader.GetOrdinal("RoomID")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("RoomID")),
        //                        RoomNumber = reader.IsDBNull(reader.GetOrdinal("RoomNumber")) ? null : reader.GetString(reader.GetOrdinal("RoomNumber")),
        //                        RoomName = reader.IsDBNull(reader.GetOrdinal("RoomName")) ? null : reader.GetString(reader.GetOrdinal("RoomName")),
        //                        RoomType = reader.IsDBNull(reader.GetOrdinal("RoomType")) ? null : reader.GetString(reader.GetOrdinal("RoomType")),
        //                        AssignmentID = reader.IsDBNull(reader.GetOrdinal("AssignmentID")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("AssignmentID")),
        //                        AssignmentDate = reader.IsDBNull(reader.GetOrdinal("AssignmentDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("AssignmentDate")),
        //                        AssignmentStatus = reader.IsDBNull(reader.GetOrdinal("AssignmentStatus")) ? null : reader.GetString(reader.GetOrdinal("AssignmentStatus")),
        //                        DoctorName = reader.IsDBNull(reader.GetOrdinal("DoctorName")) ? null : reader.GetString(reader.GetOrdinal("DoctorName"))
        //                    });
        //                }
        //            }

        //            return Ok(history);
        //        }
        //    }
        //    catch (SqlException ex)
        //    {
        //        return StatusCode(500, new { message = "A database error occurred while retrieving patient history.", error = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "An error occurred while retrieving patient history.", error = ex.Message });
        //    }
        //}
        [HttpGet("history/{cardNumber}")]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetPatientHistoryByCardNumber(string cardNumber)
        {
            if (string.IsNullOrWhiteSpace(cardNumber))
                return BadRequest(new { message = "Invalid Card Number." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_PatientHistory WHERE CardNumber = @CardNumber", connection))
                {
                    command.Parameters.Add("@CardNumber", SqlDbType.VarChar).Value = cardNumber;
                    await connection.OpenAsync();
                    var history = new List<Dictionary<string, object>>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var record = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                record[columnName] = value;
                            }
                            history.Add(record);
                        }
                    }

                    return Ok(history);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving patient history.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving patient history.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AssignPatient([FromBody] PatientAssignment assignment)
        {
            if (assignment == null || assignment.CardID <= 0 || assignment.AssignedRoom == Guid.Empty ||
                assignment.DoctorID == Guid.Empty || assignment.AssignedBy == Guid.Empty)
            {
                return BadRequest(new { message = "Invalid assignment data. Required fields: CardID, AssignedRoom, DoctorID, AssignedBy." });
            }


            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_AssignPatient", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@CardID", SqlDbType.Int).Value = assignment.CardID;
                    command.Parameters.Add("@AssignedRoom", SqlDbType.UniqueIdentifier).Value = assignment.AssignedRoom;
                    command.Parameters.Add("@DoctorID", SqlDbType.UniqueIdentifier).Value = assignment.DoctorID;
                    command.Parameters.Add("@AssignedBy", SqlDbType.UniqueIdentifier).Value = assignment.AssignedBy;

                    await connection.OpenAsync();
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var result = reader.GetString(reader.GetOrdinal("Result"));
                            if (result != "Success")
                                return StatusCode(500, new { message = "Failed to assign patient." });
                        }
                        else
                        {
                            return NotFound(new { message = "Patient card not found." });
                        }
                    }

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while assigning the patient.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while assigning the patient.", error = ex.Message });
            }
        }


        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateAssignmentStatus(int id, [FromBody] string status)
        {
            if (id <= 0 || string.IsNullOrWhiteSpace(status))
                return BadRequest(new { message = "Invalid Assignment ID or status." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("UPDATE [CHMS].PatientAssignments SET Status = @Status WHERE AssignmentID = @AssignmentID AND IsActive = 1", connection))
                {
                    command.Parameters.Add("@AssignmentID", SqlDbType.Int).Value = id;
                    command.Parameters.Add("@Status", SqlDbType.NVarChar).Value = status;
                    await connection.OpenAsync();
                    var rowsAffected = await command.ExecuteNonQueryAsync();

                    if (rowsAffected == 0)
                        return NotFound(new { message = "Patient assignment not found." });

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while updating the assignment status.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the assignment status.", error = ex.Message });
            }
        }
    }
}