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
    public class CHMS_EmployeesController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_EmployeesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Employee>>> GetEmployees()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].Employees WHERE IsActive = 1 ORDER BY FirstName, LastName", connection))
                {
                    await connection.OpenAsync();
                    var employees = new List<Employee>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            employees.Add(new Employee
                            {
                                UserID = reader.GetGuid(reader.GetOrdinal("UserID")),
                                EmployeeID = reader.GetString(reader.GetOrdinal("EmployeeID")),
                                EmployeeCode = reader.GetString(reader.GetOrdinal("EmployeeCode")),
                                FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                                LastName = reader.GetString(reader.GetOrdinal("LastName")),
                                Department = reader.GetString(reader.GetOrdinal("Department")),
                                Position = reader.GetString(reader.GetOrdinal("Position")),
                                PayrollNumber = reader.GetString(reader.GetOrdinal("PayrollNumber")),
                                Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? null : reader.GetString(reader.GetOrdinal("Email")),
                                Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? null : reader.GetString(reader.GetOrdinal("Phone")),
                                HireDate = reader.GetDateTime(reader.GetOrdinal("HireDate")),
                                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                                UpdatedDate = reader.GetDateTime(reader.GetOrdinal("UpdatedDate"))
                            });
                        }
                    }

                    return Ok(employees);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving employees.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving employees.", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Employee>> GetEmployee(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid Employee ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].Employees WHERE EmployeeID = @EmployeeID AND IsActive = 1", connection))
                {
                    command.Parameters.Add("@EmployeeID", SqlDbType.Int).Value = id;
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var employee = new Employee
                            {
                                UserID = reader.GetGuid(reader.GetOrdinal("UserID")),
                                EmployeeID = reader.GetString(reader.GetOrdinal("EmployeeID")),
                                EmployeeCode = reader.GetString(reader.GetOrdinal("EmployeeCode")),
                                FirstName = reader.GetString(reader.GetOrdinal("FirstName")),
                                LastName = reader.GetString(reader.GetOrdinal("LastName")),
                                Department = reader.GetString(reader.GetOrdinal("Department")),
                                Position = reader.GetString(reader.GetOrdinal("Position")),
                                PayrollNumber = reader.GetString(reader.GetOrdinal("PayrollNumber")),
                                Email = reader.IsDBNull(reader.GetOrdinal("Email")) ? null : reader.GetString(reader.GetOrdinal("Email")),
                                Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? null : reader.GetString(reader.GetOrdinal("Phone")),
                                HireDate = reader.GetDateTime(reader.GetOrdinal("HireDate")),
                                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                                UpdatedDate = reader.GetDateTime(reader.GetOrdinal("UpdatedDate"))
                            };

                            return Ok(employee);
                        }

                        return NotFound(new { message = "Employee not found or is inactive." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the employee.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the employee.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Employee>> CreateEmployee([FromBody] Employee employee)
        {
            if (employee == null || string.IsNullOrWhiteSpace(employee.EmployeeCode) || string.IsNullOrWhiteSpace(employee.FirstName) ||
                string.IsNullOrWhiteSpace(employee.LastName) || string.IsNullOrWhiteSpace(employee.Department) ||
                string.IsNullOrWhiteSpace(employee.Position) || string.IsNullOrWhiteSpace(employee.PayrollNumber) ||
                employee.HireDate == default)
            {
                return BadRequest(new { message = "Employee data is incomplete. Required fields: EmployeeCode, FirstName, LastName, Department, Position, PayrollNumber, HireDate." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand(
                    @"INSERT INTO [CHMS].Employees (EmployeeCode, FirstName, LastName, Department, Position, PayrollNumber, Email, Phone, HireDate, IsActive, CreatedDate, UpdatedDate)
                      VALUES (@EmployeeCode noncon, @FirstName, @LastName, @Department, @Position, @PayrollNumber, @Email, @Phone, @HireDate, @IsActive, @CreatedDate, @UpdatedDate);
                      SELECT SCOPE_IDENTITY();", connection))
                {
                    command.Parameters.Add("@UserID", SqlDbType.UniqueIdentifier).Value = employee.UserID;
                    command.Parameters.Add("@EmployeeCode", SqlDbType.NVarChar).Value = employee.EmployeeCode;
                    command.Parameters.Add("@FirstName", SqlDbType.NVarChar).Value = employee.FirstName;
                    command.Parameters.Add("@LastName", SqlDbType.NVarChar).Value = employee.LastName;
                    command.Parameters.Add("@Department", SqlDbType.NVarChar).Value = employee.Department;
                    command.Parameters.Add("@Position", SqlDbType.NVarChar).Value = employee.Position;
                    command.Parameters.Add("@PayrollNumber", SqlDbType.NVarChar).Value = employee.PayrollNumber;
                    command.Parameters.Add("@Email", SqlDbType.NVarChar).Value = (object?)employee.Email ?? DBNull.Value;
                    command.Parameters.Add("@Phone", SqlDbType.NVarChar).Value = (object?)employee.Phone ?? DBNull.Value;
                    command.Parameters.Add("@HireDate", SqlDbType.DateTime).Value = employee.HireDate;
                    command.Parameters.Add("@IsActive", SqlDbType.Bit).Value = true; // Default to active
                    command.Parameters.Add("@CreatedDate", SqlDbType.DateTime).Value = DateTime.UtcNow;
                    command.Parameters.Add("@UpdatedDate", SqlDbType.DateTime).Value = DateTime.UtcNow;

                    await connection.OpenAsync();
                    var employeeId = await command.ExecuteScalarAsync();

                    employee.EmployeeID = Convert.ToInt32(employeeId).ToString();
                    return CreatedAtAction(nameof(GetEmployee), new { id = employee.EmployeeID }, employee);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the employee.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the employee.", error = ex.Message });
            }
        }
    }
}