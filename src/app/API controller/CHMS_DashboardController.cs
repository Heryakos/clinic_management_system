using HospitalManagementSystem.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Data;
using System.Threading.Tasks;

namespace HospitalManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CHMS_DashboardController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_DashboardController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet("overview")]
        public async Task<ActionResult<DashboardOverview>> GetDashboardOverview()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_DashboardOverview", connection))
                {
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var overview = new DashboardOverview
                            {
                                TotalPatients = reader.GetInt32(reader.GetOrdinal("TotalPatients")),
                                PendingMedicalRequests = reader.GetInt32(reader.GetOrdinal("PendingMedicalRequests")),
                                ActivePrescriptions = reader.GetInt32(reader.GetOrdinal("ActivePrescriptions")),
                                PendingLabTests = reader.GetInt32(reader.GetOrdinal("PendingLabTests")),
                                PendingExpenseReimbursements = reader.GetInt32(reader.GetOrdinal("PendingExpenseReimbursements")),
                                PendingInventoryRequests = reader.GetInt32(reader.GetOrdinal("PendingInventoryRequests")),
                                ActiveSickLeaves = reader.GetInt32(reader.GetOrdinal("ActiveSickLeaves")),
                                LowStockItems = reader.GetInt32(reader.GetOrdinal("LowStockItems")),
                                NearExpiryItems = reader.GetInt32(reader.GetOrdinal("NearExpiryItems"))
                            };

                            return Ok(overview);
                        }

                        return NotFound(new { message = "No dashboard overview data found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving dashboard overview.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving dashboard overview.", error = ex.Message });
            }
        }

        [HttpGet("monthly-statistics")]
        public async Task<ActionResult<MonthlyStatistics>> GetMonthlyStatistics()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_MonthlyStatistics", connection))
                {
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var statistics = new MonthlyStatistics
                            {
                                Year = reader.GetInt32(reader.GetOrdinal("Year")),
                                Month = reader.GetInt32(reader.GetOrdinal("Month")),
                                MonthName = reader.GetString(reader.GetOrdinal("MonthName")),
                                NewPatients = reader.GetInt32(reader.GetOrdinal("NewPatients")),
                                MedicalRequests = reader.GetInt32(reader.GetOrdinal("MedicalRequests")),
                                Prescriptions = reader.GetInt32(reader.GetOrdinal("Prescriptions")),
                                LabTests = reader.GetInt32(reader.GetOrdinal("LabTests")),
                                ExpenseReimbursements = reader.GetInt32(reader.GetOrdinal("ExpenseReimbursements")),
                                InventoryRequests = reader.GetInt32(reader.GetOrdinal("InventoryRequests")),
                                SickLeaves = reader.GetInt32(reader.GetOrdinal("SickLeaves"))
                            };

                            return Ok(statistics);
                        }

                        return NotFound(new { message = "No monthly statistics data found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving monthly statistics.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving monthly statistics.", error = ex.Message });
            }
        }
    }
}