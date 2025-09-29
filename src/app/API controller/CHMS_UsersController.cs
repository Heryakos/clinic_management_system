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
    public class CHMS_UsersController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_UsersController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Dictionary<string, object>>>> GetAllUsers()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetAllUsers]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    await connection.OpenAsync();
                    var users = new List<Dictionary<string, object>>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var user = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                var columnName = reader.GetName(i);
                                var value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                user[columnName] = value;
                            }
                            users.Add(user);
                        }
                    }

                    return Ok(users);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving users.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving users.", error = ex.Message });
            }
        }

        [HttpGet("{username}")]
        public async Task<ActionResult<Dictionary<string, object>>> GetUserByUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest(new { message = "Username is required." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetUserByUsername]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@Username", SqlDbType.NVarChar).Value = username;
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (!reader.HasRows)
                            return NotFound(new { message = "User not found." });

                        await reader.ReadAsync();
                        var user = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            var columnName = reader.GetName(i);
                            var value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                            user[columnName] = value;
                        }

                        return Ok(user);
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the user.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the user.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<User>> CreateUser([FromBody] User user)
        {
            if (user == null || string.IsNullOrWhiteSpace(user.Username) || string.IsNullOrWhiteSpace(user.Email) ||
                string.IsNullOrWhiteSpace(user.FirstName) || string.IsNullOrWhiteSpace(user.LastName) ||
                string.IsNullOrWhiteSpace(user.Role))
            {
                return BadRequest(new { message = "User data is incomplete. Required fields: Username, Email, FirstName, LastName, Role." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_CreateUser]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@Username", SqlDbType.NVarChar).Value = user.Username;
                    command.Parameters.Add("@PasswordHash", SqlDbType.NVarChar).Value = user.PasswordHash ?? "";
                    command.Parameters.Add("@Email", SqlDbType.NVarChar).Value = user.Email;
                    command.Parameters.Add("@FirstName", SqlDbType.NVarChar).Value = user.FirstName;
                    command.Parameters.Add("@LastName", SqlDbType.NVarChar).Value = user.LastName;
                    command.Parameters.Add("@Role", SqlDbType.NVarChar).Value = user.Role;
                    command.Parameters.Add("@Department", SqlDbType.NVarChar).Value = (object?)user.Department ?? DBNull.Value;
                    command.Parameters.Add("@CreatedBy", SqlDbType.UniqueIdentifier).Value = (object?)user.CreatedBy ?? DBNull.Value;

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return CreatedAtAction(nameof(GetUserByUsername), new { username = user.Username }, user);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the user.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the user.", error = ex.Message });
            }
        }

        [HttpPut("{userId}")]
        public async Task<ActionResult> UpdateUser(Guid userId, [FromBody] User user)
        {
            if (user == null || userId == Guid.Empty || string.IsNullOrWhiteSpace(user.Username) ||
                string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.FirstName) ||
                string.IsNullOrWhiteSpace(user.LastName) || string.IsNullOrWhiteSpace(user.Role))
            {
                return BadRequest(new { message = "User data is incomplete. Required fields: Username, Email, FirstName, LastName, Role." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_UpdateUser]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@UserID", SqlDbType.UniqueIdentifier).Value = userId;
                    command.Parameters.Add("@Username", SqlDbType.NVarChar).Value = user.Username;
                    command.Parameters.Add("@Email", SqlDbType.NVarChar).Value = user.Email;
                    command.Parameters.Add("@FirstName", SqlDbType.NVarChar).Value = user.FirstName;
                    command.Parameters.Add("@LastName", SqlDbType.NVarChar).Value = user.LastName;
                    command.Parameters.Add("@Role", SqlDbType.NVarChar).Value = user.Role;
                    command.Parameters.Add("@Department", SqlDbType.NVarChar).Value = (object?)user.Department ?? DBNull.Value;
                    command.Parameters.Add("@IsActive", SqlDbType.Bit).Value = user.IsActive;

                    await connection.OpenAsync();
                    var rowsAffected = await command.ExecuteNonQueryAsync();

                    if (rowsAffected == 0)
                        return NotFound(new { message = "User not found." });

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while updating the user.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the user.", error = ex.Message });
            }
        }

        [HttpDelete("{userId}")]
        public async Task<ActionResult> DeleteUser(Guid userId)
        {
            if (userId == Guid.Empty)
                return BadRequest(new { message = "Invalid User ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_DeleteUser]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@UserID", SqlDbType.UniqueIdentifier).Value = userId;

                    await connection.OpenAsync();
                    var rowsAffected = await command.ExecuteNonQueryAsync();

                    if (rowsAffected == 0)
                        return NotFound(new { message = "User not found." });

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while deleting the user.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the user.", error = ex.Message });
            }
        }
    }
}