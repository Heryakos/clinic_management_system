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
    public class CHMS_ExpenseReimbursementController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_ExpenseReimbursementController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExpenseReimbursement>>> GetExpenseReimbursements()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_ExpenseReimbursements ORDER BY SubmissionDate DESC", connection))
                {
                    await connection.OpenAsync();
                    var reimbursements = new List<ExpenseReimbursement>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            reimbursements.Add(new ExpenseReimbursement
                            {
                                ReimbursementID = reader.GetInt32(reader.GetOrdinal("ReimbursementID")),
                                ReimbursementNumber = reader.GetString(reader.GetOrdinal("ReimbursementNumber")),
                                PatientName = reader.GetString(reader.GetOrdinal("PatientName")),
                                EmployeeID = reader.IsDBNull(reader.GetOrdinal("EmployeeID")) ? null :reader.GetString(reader.GetOrdinal("EmployeeID")),
                                PayrollNumber = reader.IsDBNull(reader.GetOrdinal("PayrollNumber")) ? null : reader.GetString(reader.GetOrdinal("PayrollNumber")),
                                Department = reader.IsDBNull(reader.GetOrdinal("Department")) ? null : reader.GetString(reader.GetOrdinal("Department")),
                                TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                SubmissionDate = reader.GetDateTime(reader.GetOrdinal("SubmissionDate")),
                                ApprovedBy = reader.IsDBNull(reader.GetOrdinal("ApprovedBy")) ? null : (Guid?)reader.GetGuid(reader.GetOrdinal("ApprovedBy")),
                                ApprovedDate = reader.IsDBNull(reader.GetOrdinal("ApprovedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ApprovedDate")),
                                PaidDate = reader.IsDBNull(reader.GetOrdinal("PaidDate")) ? (DateTime?) null : reader.GetDateTime(reader.GetOrdinal("PaidDate")),
                                Comments = reader.IsDBNull(reader.GetOrdinal("Comments")) ? null : reader.GetString(reader.GetOrdinal("Comments")),
                                CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? null :(Guid?) reader.GetGuid(reader.GetOrdinal("CreatedBy"))
                            });
                        }
                    }

                    return Ok(reimbursements);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving expense reimbursements.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving expense reimbursements.", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ExpenseReimbursement>> GetExpenseReimbursement(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid Reimbursement ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_ExpenseReimbursements WHERE ReimbursementID = @ReimbursementID", connection))
                {
                    command.Parameters.Add("@ReimbursementID", SqlDbType.Int).Value = id;
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var reimbursement = new ExpenseReimbursement
                            {
                                ReimbursementID = reader.GetInt32(reader.GetOrdinal("ReimbursementID")),
                                ReimbursementNumber = reader.GetString(reader.GetOrdinal("ReimbursementNumber")),
                                PatientName = reader.GetString(reader.GetOrdinal("PatientName")),
                                EmployeeID = reader.IsDBNull(reader.GetOrdinal("EmployeeID")) ? null :reader.GetString(reader.GetOrdinal("EmployeeID")),
                                PayrollNumber = reader.IsDBNull(reader.GetOrdinal("PayrollNumber")) ? null : reader.GetString(reader.GetOrdinal("PayrollNumber")),
                                Department = reader.IsDBNull(reader.GetOrdinal("Department")) ? null : reader.GetString(reader.GetOrdinal("Department")),
                                TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                SubmissionDate = reader.GetDateTime(reader.GetOrdinal("SubmissionDate")),
                                ApprovedBy = reader.IsDBNull(reader.GetOrdinal("ApprovedBy")) ? null : (Guid?)reader.GetGuid(reader.GetOrdinal("ApprovedBy")),
                                ApprovedDate = reader.IsDBNull(reader.GetOrdinal("ApprovedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ApprovedDate")),
                                PaidDate = reader.IsDBNull(reader.GetOrdinal("PaidDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("PaidDate")),
                                Comments = reader.IsDBNull(reader.GetOrdinal("Comments")) ? null : reader.GetString(reader.GetOrdinal("Comments")),
                                CreatedBy = reader.IsDBNull(reader.GetOrdinal("CreatedBy")) ? null : (Guid?)reader.GetGuid(reader.GetOrdinal("CreatedBy"))
                            };

                            return Ok(reimbursement);
                        }

                        return NotFound(new { message = "Expense reimbursement not found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the expense reimbursement.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the expense reimbursement.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ExpenseReimbursement>> CreateExpenseReimbursement([FromBody] ExpenseReimbursement reimbursement)
        {
            if (reimbursement == null || string.IsNullOrWhiteSpace(reimbursement.ReimbursementNumber) ||
                string.IsNullOrWhiteSpace(reimbursement.PatientName) || reimbursement.CreatedBy == null ||
                reimbursement.TotalAmount <= 0 || reimbursement.SubmissionDate == default)
            {
                return BadRequest(new { message = "Reimbursement data is incomplete. Required fields: ReimbursementNumber, PatientName, CreatedBy, TotalAmount, SubmissionDate." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_CreateExpenseReimbursement", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@ReimbursementNumber", SqlDbType.NVarChar).Value = reimbursement.ReimbursementNumber;
                    command.Parameters.Add("@PatientName", SqlDbType.NVarChar).Value = reimbursement.PatientName;
                    command.Parameters.Add("@EmployeeID", SqlDbType.UniqueIdentifier).Value = (object?)reimbursement.EmployeeID ?? DBNull.Value;
                    command.Parameters.Add("@PayrollNumber", SqlDbType.NVarChar).Value = (object?)reimbursement.PayrollNumber ?? DBNull.Value;
                    command.Parameters.Add("@Department", SqlDbType.NVarChar).Value = (object?)reimbursement.Department ?? DBNull.Value;
                    command.Parameters.Add("@TotalAmount", SqlDbType.Decimal).Value = reimbursement.TotalAmount;
                    command.Parameters.Add("@SubmissionDate", SqlDbType.DateTime).Value = reimbursement.SubmissionDate;
                    command.Parameters.Add("@CreatedBy", SqlDbType.UniqueIdentifier).Value = reimbursement.CreatedBy;
                    var reimbursementIdParam = new SqlParameter("@ReimbursementID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(reimbursementIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    reimbursement.ReimbursementID = (int)reimbursementIdParam.Value;
                    return CreatedAtAction(nameof(GetExpenseReimbursement), new { id = reimbursement.ReimbursementID }, reimbursement);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the expense reimbursement.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the expense reimbursement.", error = ex.Message });
            }
        }

        [HttpGet("{reimbursementId}/details")]
        public async Task<ActionResult<IEnumerable<ExpenseReimbursementDetail>>> GetReimbursementDetails(int reimbursementId)
        {
            if (reimbursementId <= 0)
                return BadRequest(new { message = "Invalid Reimbursement ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].ExpenseReimbursementDetails WHERE ReimbursementID = @ReimbursementID", connection))
                {
                    command.Parameters.Add("@ReimbursementID", SqlDbType.Int).Value = reimbursementId;
                    await connection.OpenAsync();
                    var details = new List<ExpenseReimbursementDetail>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            details.Add(new ExpenseReimbursementDetail
                            {
                                DetailID = reader.GetInt32(reader.GetOrdinal("DetailID")),
                                ReimbursementID = reader.GetInt32(reader.GetOrdinal("ReimbursementID")),
                                InvestigationType = reader.GetString(reader.GetOrdinal("InvestigationType")),
                                Location = reader.GetString(reader.GetOrdinal("Location")),
                                InvoiceNumber = reader.GetString(reader.GetOrdinal("InvoiceNumber")),
                                Amount = reader.GetDecimal(reader.GetOrdinal("Amount")),
                                InvestigationDate = reader.IsDBNull(reader.GetOrdinal("InvestigationDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("InvestigationDate"))
                            });
                        }
                    }

                    return Ok(details);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving reimbursement details.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving reimbursement details.", error = ex.Message });
            }
        }

        [HttpPost("{reimbursementId}/details")]
        public async Task<ActionResult<ExpenseReimbursementDetail>> AddReimbursementDetail(int reimbursementId, [FromBody] ExpenseReimbursementDetail detail)
        {
            if (reimbursementId <= 0 || detail == null || string.IsNullOrWhiteSpace(detail.InvestigationType) ||
                string.IsNullOrWhiteSpace(detail.Location) || string.IsNullOrWhiteSpace(detail.InvoiceNumber) || detail.Amount <= 0)
            {
                return BadRequest(new { message = "Detail data is incomplete. Required fields: InvestigationType, Location, InvoiceNumber, Amount." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_AddExpenseReimbursementDetails", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@ReimbursementID", SqlDbType.Int).Value = reimbursementId;
                    command.Parameters.Add("@InvestigationType", SqlDbType.NVarChar).Value = detail.InvestigationType;
                    command.Parameters.Add("@Location", SqlDbType.NVarChar).Value = detail.Location;
                    command.Parameters.Add("@InvoiceNumber", SqlDbType.NVarChar).Value = detail.InvoiceNumber;
                    command.Parameters.Add("@Amount", SqlDbType.Decimal).Value = detail.Amount;
                    command.Parameters.Add("@InvestigationDate", SqlDbType.DateTime).Value = (object?)detail.InvestigationDate ?? DBNull.Value;
                    var detailIdParam = new SqlParameter("@DetailID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(detailIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    detail.DetailID = (int)detailIdParam.Value;
                    detail.ReimbursementID = reimbursementId;
                    return CreatedAtAction(nameof(GetReimbursementDetails), new { reimbursementId = reimbursementId }, detail);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while adding reimbursement detail.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding reimbursement detail.", error = ex.Message });
            }
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveReimbursement(int id, [FromBody] ApprovalRequest approval)
        {
            if (id <= 0 || approval == null || approval.ApprovedBy == null)
                return BadRequest(new { message = "Invalid Reimbursement ID or approval data. Required fields: ApprovedBy." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand(
                    @"UPDATE [CHMS].ExpenseReimbursements 
                      SET Status = @Status, ApprovedBy = @ApprovedBy, ApprovedDate = GETUTCDATE(), Comments = @Comments
                      WHERE ReimbursementID = @ReimbursementID", connection))
                {
                    command.Parameters.Add("@ReimbursementID", SqlDbType.Int).Value = id;
                    //command.Parameters.Add("@Status", SqlDbType.NVarChar).Value = approval.IsApproved ? "Approved" : "Rejected";
                    command.Parameters.Add("@ApprovedBy", SqlDbType.Int).Value = approval.ApprovedBy;
                    command.Parameters.Add("@Comments", SqlDbType.NVarChar).Value = (object?)approval.Comments ?? DBNull.Value;

                    await connection.OpenAsync();
                    var rowsAffected = await command.ExecuteNonQueryAsync();

                    if (rowsAffected == 0)
                        return NotFound(new { message = "Expense reimbursement not found." });

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while approving the reimbursement.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while approving the reimbursement.", error = ex.Message });
            }
        }
    }
}