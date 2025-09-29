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
    public class CHMS_ReportsController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_ReportsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet("monthly/{year}/{month}")]
        public async Task<ActionResult<IEnumerable<MonthlyReportItem>>> GetMonthlyReport(int year, int month)
        {
            if (year < 1900 || year > 9999 || month < 1 || month > 12)
                return BadRequest(new { message = "Invalid year or month. Year must be between 1900 and 9999, and month must be between 1 and 12." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_GenerateMonthlyReport", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@Year", SqlDbType.Int).Value = year;
                    command.Parameters.Add("@Month", SqlDbType.Int).Value = month;

                    await connection.OpenAsync();
                    var reportData = new List<MonthlyReportItem>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            reportData.Add(new MonthlyReportItem
                            {
                                Category = reader.GetString(reader.GetOrdinal("Category")),
                                Count = reader.GetInt32(reader.GetOrdinal("Count")),
                                Amount = reader.GetDecimal(reader.GetOrdinal("Amount"))
                            });
                        }
                    }

                    return Ok(reportData);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the monthly report.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the monthly report.", error = ex.Message });
            }
        }

        [HttpGet("department-statistics")]
        public async Task<ActionResult<IEnumerable<DepartmentStatistics>>> GetDepartmentStatistics()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();

                    // Prefer stored procedure if available
                    try
                    {
                        using (var command = new SqlCommand("[CHMS].[sp_GetDepartmentStatistics]", connection))
                        {
                            command.CommandType = CommandType.StoredProcedure;
                            var statistics = new List<DepartmentStatistics>();

                            using (var reader = await command.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    statistics.Add(new DepartmentStatistics
                                    {
                                        Department = reader["Department"].ToString(),
                                        TotalEmployees = Convert.ToInt32(reader["TotalEmployees"]),
                                        MedicalRequests = Convert.ToInt32(reader["MedicalRequests"]),
                                        SickLeaves = Convert.ToInt32(reader["SickLeaves"]),
                                        TotalExpenseReimbursements = Convert.ToDecimal(reader["TotalExpenseReimbursements"]),
                                        ExpenseReimbursementCount = Convert.ToInt32(reader["ExpenseReimbursementCount"])
                                    });
                                }
                            }

                            return Ok(statistics);
                        }
                    }
                    catch (SqlException)
                    {
                        // Fallback to view
                        using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_DepartmentStatistics", connection))
                        {
                            var statistics = new List<DepartmentStatistics>();

                            using (var reader = await command.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    statistics.Add(new DepartmentStatistics
                                    {
                                        Department = reader.GetString(reader.GetOrdinal("Department")),
                                        TotalEmployees = reader.GetInt32(reader.GetOrdinal("TotalEmployees")),
                                        MedicalRequests = reader.GetInt32(reader.GetOrdinal("MedicalRequests")),
                                        SickLeaves = reader.GetInt32(reader.GetOrdinal("SickLeaves")),
                                        TotalExpenseReimbursements = reader.GetDecimal(reader.GetOrdinal("TotalExpenseReimbursements")),
                                        ExpenseReimbursementCount = reader.GetInt32(reader.GetOrdinal("ExpenseReimbursementCount"))
                                    });
                                }
                            }

                            return Ok(statistics);
                        }
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving department statistics.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving department statistics.", error = ex.Message });
            }
        }

        [HttpGet("financial-summary")]
        public async Task<ActionResult<FinancialSummary>> GetFinancialSummary()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();

                    // Prefer stored procedure if available
                    try
                    {
                        using (var command = new SqlCommand("[CHMS].[sp_GetFinancialSummary]", connection))
                        {
                            command.CommandType = CommandType.StoredProcedure;

                            using (var reader = await command.ExecuteReaderAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    var summary = new FinancialSummary
                                    {
                                        PrescriptionRevenue = Convert.ToDecimal(reader["PrescriptionRevenue"]),
                                        ExpenseReimbursements = Convert.ToDecimal(reader["ExpenseReimbursements"]),
                                        InventoryValue = Convert.ToDecimal(reader["InventoryValue"]),
                                        LabTestRevenue = Convert.ToInt32(reader["LabTestRevenue"]) 
                                    };
                                    return Ok(summary);
                                }
                            }
                        }
                    }
                    catch (SqlException)
                    {
                        // Fallback to view
                        using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_FinancialSummary", connection))
                        {
                            using (var reader = await command.ExecuteReaderAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    var summary = new FinancialSummary
                                    {
                                        PrescriptionRevenue = reader.GetDecimal(reader.GetOrdinal("PrescriptionRevenue")),
                                        ExpenseReimbursements = reader.GetDecimal(reader.GetOrdinal("ExpenseReimbursements")),
                                        InventoryValue = reader.GetDecimal(reader.GetOrdinal("InventoryValue")),
                                        LabTestRevenue = reader.GetInt32(reader.GetOrdinal("LabTestRevenue"))
                                    };

                                    return Ok(summary);
                                }
                            }
                        }
                    }

                    return NotFound(new { message = "Financial summary not found." });
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the financial summary.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the financial summary.", error = ex.Message });
            }
        }

        [HttpGet("patient-statistics")]
        public async Task<ActionResult<PatientStatistics>> GetPatientStatistics()
        {
            try
            {
                var statistics = new PatientStatistics();

                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();

                    // Total Patients
                    using (var command = new SqlCommand(
                        "SELECT COUNT(*) FROM [CHMS].Patients WHERE IsActive = 1", connection))
                    {
                        statistics.TotalPatients = Convert.ToInt32(await command.ExecuteScalarAsync());
                    }

                    // New Patients This Month
                    using (var command = new SqlCommand(
                        "SELECT COUNT(*) FROM [CHMS].Patients WHERE YEAR(RegistrationDate) = YEAR(GETUTCDATE()) AND MONTH(RegistrationDate) = MONTH(GETUTCDATE())", connection))
                    {
                        statistics.NewPatientsThisMonth = Convert.ToInt32(await command.ExecuteScalarAsync());
                    }

                    // Total Visits This Month
                    using (var command = new SqlCommand(
                        "SELECT COUNT(*) FROM [CHMS].PatientCards WHERE YEAR(VisitDate) = YEAR(GETUTCDATE()) AND MONTH(VisitDate) = MONTH(GETUTCDATE())", connection))
                    {
                        statistics.TotalVisitsThisMonth = Convert.ToInt32(await command.ExecuteScalarAsync());
                    }

                    // Gender Distribution
                    var genderStats = new List<GenderDistribution>();
                    using (var command = new SqlCommand(
                        "SELECT TOP 5 Gender, COUNT(*) as Count FROM [CHMS].Patients WHERE IsActive = 1 GROUP BY Gender", connection))
                    {
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                genderStats.Add(new GenderDistribution
                                {
                                    Gender = reader.GetString(reader.GetOrdinal("Gender")),
                                    Count = reader.GetInt32(reader.GetOrdinal("Count"))
                                });
                            }
                        }
                    }
                    statistics.GenderDistribution = genderStats;
                }

                return Ok(statistics);
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving patient statistics.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving patient statistics.", error = ex.Message });
            }
        }
    }

    // Models for strongly typed responses
    public class MonthlyReportItem
    {
        public string Category { get; set; }
        public int Count { get; set; }
        public decimal Amount { get; set; }
    }

    public class DepartmentStatistics
    {
        public string Department { get; set; }
        public int TotalEmployees { get; set; }
        public int MedicalRequests { get; set; }
        public int SickLeaves { get; set; }
        public decimal TotalExpenseReimbursements { get; set; }
        public int ExpenseReimbursementCount { get; set; }
    }

    public class FinancialSummary
    {
        public decimal PrescriptionRevenue { get; set; }
        public decimal ExpenseReimbursements { get; set; }
        public decimal InventoryValue { get; set; }
        public int LabTestRevenue { get; set; }
    }

    public class PatientStatistics
    {
        public int TotalPatients { get; set; }
        public int NewPatientsThisMonth { get; set; }
        public int TotalVisitsThisMonth { get; set; }
        public IEnumerable<GenderDistribution> GenderDistribution { get; set; }
    }

    public class GenderDistribution
    {
        public string Gender { get; set; }
        public int Count { get; set; }
    }
}