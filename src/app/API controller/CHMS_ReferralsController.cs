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
    public class CHMS_ReferralsController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_ReferralsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }


        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<Referral>>> GetPatientReferrals(int patientId)
        {
            if (patientId <= 0)
                return BadRequest(new { message = "Invalid Patient ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].Referrals WHERE PatientID = @PatientID ORDER BY ReferralDate DESC", connection))
                {
                    command.Parameters.Add("@PatientID", SqlDbType.Int).Value = patientId;
                    await connection.OpenAsync();
                    var referrals = new List<Referral>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            referrals.Add(new Referral
                            {
                                ReferralID = reader.GetInt32(reader.GetOrdinal("ReferralID")),
                                PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
                                CardNumber = reader.GetString(reader.GetOrdinal("CardNumber")),
                                ReferringPhysician = reader.GetGuid(reader.GetOrdinal("ReferringPhysician")),
                                Department = reader.GetString(reader.GetOrdinal("Department")),
                                ReferralDate = reader.GetDateTime(reader.GetOrdinal("ReferralDate")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                Notes = reader.IsDBNull(reader.GetOrdinal("Notes")) ? null : reader.GetString(reader.GetOrdinal("Notes")),
                                ReferenceID = reader.IsDBNull(reader.GetOrdinal("ReferenceID")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("ReferenceID")),
                                CreatedBy = reader.GetGuid(reader.GetOrdinal("CreatedBy")),
                                CompletedDate = reader.IsDBNull(reader.GetOrdinal("CompletedDate")) ? null : (DateTime?)reader.GetDateTime(reader.GetOrdinal("CompletedDate"))
                            });
                        }
                    }

                    return Ok(referrals);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving patient referrals.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving patient referrals.", error = ex.Message });
            }
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<Referral>> GetReferral(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid Referral ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].Referrals WHERE ReferralID = @ReferralID", connection))
                {
                    command.Parameters.Add("@ReferralID", SqlDbType.Int).Value = id;
                    await connection.OpenAsync();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var referral = new Referral
                            {
                                ReferralID = reader.GetInt32(reader.GetOrdinal("ReferralID")),
                                PatientID = reader.GetInt32(reader.GetOrdinal("PatientID")),
                                CardNumber = reader.GetString(reader.GetOrdinal("CardNumber")),
                                ReferringPhysician = reader.GetGuid(reader.GetOrdinal("ReferringPhysician")),
                                Department = reader.GetString(reader.GetOrdinal("Department")),
                                ReferralDate = reader.GetDateTime(reader.GetOrdinal("ReferralDate")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                Notes = reader.IsDBNull(reader.GetOrdinal("Notes")) ? null : reader.GetString(reader.GetOrdinal("Notes")),
                                ReferenceID = reader.IsDBNull(reader.GetOrdinal("ReferenceID")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("ReferenceID")),
                                CreatedBy = reader.GetGuid(reader.GetOrdinal("CreatedBy")),
                                CompletedDate = reader.IsDBNull(reader.GetOrdinal("CompletedDate")) ? null : (DateTime?)reader.GetDateTime(reader.GetOrdinal("CompletedDate"))
                            };

                            return Ok(referral);
                        }

                        return NotFound(new { message = "Referral not found." });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the referral.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the referral.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Referral>> CreateReferral([FromBody] Referral referral)
        {
            if (referral == null || referral.PatientID <= 0 || referral.ReferringPhysician == Guid.Empty ||
                string.IsNullOrWhiteSpace(referral.Department) || referral.CreatedBy == null)
            {
                return BadRequest(new { message = "Referral data is incomplete. Required fields: PatientID, ReferringPhysician, Department, CreatedBy." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_CreateReferral]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@PatientID", SqlDbType.Int).Value = referral.PatientID;
                    command.Parameters.Add("@CardNumber", SqlDbType.NVarChar).Value = referral.CardNumber;
                    command.Parameters.Add("@ReferringPhysician", SqlDbType.UniqueIdentifier).Value = referral.ReferringPhysician;
                    command.Parameters.Add("@Department", SqlDbType.NVarChar).Value = referral.Department;
                    command.Parameters.Add("@Notes", SqlDbType.NVarChar).Value = (object?)referral.Notes ?? DBNull.Value;
                    command.Parameters.Add("@ReferenceID", SqlDbType.Int).Value = (object?)referral.ReferenceID ?? DBNull.Value;
                    command.Parameters.Add("@CreatedBy", SqlDbType.UniqueIdentifier).Value = referral.CreatedBy;
                    var referralIdParam = new SqlParameter("@ReferralID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(referralIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    referral.ReferralID = (int)referralIdParam.Value;
                    return CreatedAtAction(nameof(GetReferral), new { id = referral.ReferralID }, referral);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the referral.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the referral.", error = ex.Message });
            }
        }



        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateReferralStatus(int id, [FromBody] ReferralStatusUpdate update)
        {
            if (id <= 0 || update == null || string.IsNullOrWhiteSpace(update.Status))
                return BadRequest(new { message = "Invalid Referral ID or status data. Required fields: Status." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_UpdateReferralStatus]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@ReferralID", SqlDbType.Int).Value = id;
                    command.Parameters.Add("@Status", SqlDbType.NVarChar).Value = update.Status;
                    command.Parameters.Add("@CompletedDate", SqlDbType.DateTime2).Value = (object?)update.CompletedDate ?? DBNull.Value;

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return NoContent();
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while updating the referral status.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the referral status.", error = ex.Message });
            }
        }

    }

    public class Referral
    {
        public int ReferralID { get; set; }
        public int PatientID { get; set; }
        public string CardNumber { get; set; }
        public Guid ReferringPhysician { get; set; }
        public string Department { get; set; }
        public DateTime ReferralDate { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public int? ReferenceID { get; set; }
        public Guid CreatedBy { get; set; }
        public DateTime? CompletedDate { get; set; }
    }

    public class ReferralStatusUpdate
    {
        public string Status { get; set; }
        public DateTime? CompletedDate { get; set; }
    }
}