using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Threading.Tasks;
using HospitalManagementSystem.API.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;

[Route("api/[controller]")]
[ApiController]
public class CHMS_ReferralController : ControllerBase
{
    private readonly string _connectionString;

    public CHMS_ReferralController(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("XOKADatabase");
    }
    //private readonly string _connectionString = "Your_Connection_String_Here"; // Update with your connection string

    [HttpGet("{cardNumber}")]
    public async Task<IActionResult> GetReferralDetails(string cardNumber = null)
    {
        var referrals = new List<Referral>();

        using (var connection = new SqlConnection(_connectionString))
        {
            await connection.OpenAsync();
            var command = new SqlCommand("CHMS.sp_GetReferralDetails", connection)
            {
                CommandType = CommandType.StoredProcedure
            };
            command.Parameters.AddWithValue("@CardNumber", cardNumber);

            using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    var referral = new Referral
                    {
                        ReferralID = reader.GetInt32("ReferralID"),
                        PatientID = reader.GetInt32("PatientID"),
                        CardNumber = reader.GetString("CardNumber"),
                        ReferringPhysician = reader.GetGuid("ReferringPhysician"),
                        Department = reader.GetString("Department"),
                        ReferralDate = reader.GetDateTime("ReferralDate"),
                        Status = reader.GetString("Status"),
                        Notes = reader.IsDBNull("Notes") ? null : reader.GetString("Notes"),
                        ReferenceID = reader.IsDBNull("ReferenceID") ? (int?)null : reader.GetInt32("ReferenceID"),
                        CreatedBy = reader.GetGuid("CreatedBy"),
                        CompletedDate = reader.IsDBNull("CompletedDate") ? (DateTime?)null : reader.GetDateTime("CompletedDate"),
                        ClinicalHistory = reader.IsDBNull("ClinicalHistory") ? null : reader.GetString("ClinicalHistory"),
                        CurrentDiagnosis = reader.IsDBNull("CurrentDiagnosis") ? null : reader.GetString("CurrentDiagnosis"),
                        VitalSigns = new VitalSigns
                        {
                            BloodPressure = reader.IsDBNull("VitalSignsBloodPressure") ? null : reader.GetString("VitalSignsBloodPressure"),
                            HeartRate = reader.IsDBNull("VitalSignsHeartRate") ? null : reader.GetString("VitalSignsHeartRate"),
                            Temperature = reader.IsDBNull("VitalSignsTemperature") ? null : reader.GetString("VitalSignsTemperature"),
                            Weight = reader.IsDBNull("VitalSignsWeight") ? null : reader.GetString("VitalSignsWeight"),
                            Height = reader.IsDBNull("VitalSignsHeight") ? null : reader.GetString("VitalSignsHeight")
                        },
                        CurrentMedications = reader.IsDBNull("CurrentMedications") ? null : reader.GetString("CurrentMedications"),
                        Allergies = reader.IsDBNull("Allergies") ? null : reader.GetString("Allergies"),
                        LabResults = reader.IsDBNull("LabResults") ? null : reader.GetString("LabResults"),
                        InsuranceProvider = reader.IsDBNull("InsuranceProvider") ? null : reader.GetString("InsuranceProvider"),
                        PolicyNumber = reader.IsDBNull("PolicyNumber") ? null : reader.GetString("PolicyNumber"),
                        GroupNumber = reader.IsDBNull("GroupNumber") ? null : reader.GetString("GroupNumber"),
                        UrgentFollowUp = reader.GetBoolean("UrgentFollowUp"),
                        TransportationNeeded = reader.GetBoolean("TransportationNeeded"),
                        InterpreterNeeded = reader.GetBoolean("InterpreterNeeded"),
                        AdditionalNotes = reader.IsDBNull("AdditionalNotes") ? null : reader.GetString("AdditionalNotes"),
                        PhysicianName = reader.IsDBNull("PhysicianName") ? null : reader.GetString("PhysicianName"),
                        PhysicianLicense = reader.IsDBNull("PhysicianLicense") ? null : reader.GetString("PhysicianLicense"),
                        PhysicianPhone = reader.IsDBNull("PhysicianPhone") ? null : reader.GetString("PhysicianPhone"),
                        PhysicianSignature = reader.IsDBNull("PhysicianSignature") ? null : reader.GetString("PhysicianSignature")
                    };

                    referrals.Add(referral);
                }
            }
        }

        return Ok(referrals); // Return list (even if empty)
    }



    [HttpPost("referral")]
    public async Task<IActionResult> CreateReferral([FromBody] ReferralFormData referralData)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            await connection.OpenAsync();
            var command = new SqlCommand("CHMS.sp_CreateReferral", connection)
            {
                CommandType = CommandType.StoredProcedure
            };
            command.Parameters.AddWithValue("@PatientID", referralData.PatientID);
            command.Parameters.AddWithValue("@CardNumber", referralData.CardNumber);
            command.Parameters.AddWithValue("@ReferringPhysician", referralData.ReferringPhysician);
            command.Parameters.AddWithValue("@Department", referralData.Department);
            command.Parameters.AddWithValue("@Notes", (object)referralData.Notes ?? DBNull.Value);
            command.Parameters.AddWithValue("@ReferenceID", (object)referralData.ReferenceID ?? DBNull.Value);
            command.Parameters.AddWithValue("@CreatedBy", referralData.CreatedBy);
            command.Parameters.AddWithValue("@ClinicalHistory", (object)referralData.ClinicalHistory ?? DBNull.Value);
            command.Parameters.AddWithValue("@CurrentDiagnosis", (object)referralData.CurrentDiagnosis ?? DBNull.Value);
            command.Parameters.AddWithValue("@VitalSignsBloodPressure", (object)referralData.VitalSigns?.BloodPressure ?? DBNull.Value);
            command.Parameters.AddWithValue("@VitalSignsHeartRate", (object)referralData.VitalSigns?.HeartRate ?? DBNull.Value);
            command.Parameters.AddWithValue("@VitalSignsTemperature", (object)referralData.VitalSigns?.Temperature ?? DBNull.Value);
            command.Parameters.AddWithValue("@VitalSignsWeight", (object)referralData.VitalSigns?.Weight ?? DBNull.Value);
            command.Parameters.AddWithValue("@VitalSignsHeight", (object)referralData.VitalSigns?.Height ?? DBNull.Value);
            command.Parameters.AddWithValue("@CurrentMedications", (object)referralData.CurrentMedications ?? DBNull.Value);
            command.Parameters.AddWithValue("@Allergies", (object)referralData.Allergies ?? DBNull.Value);
            command.Parameters.AddWithValue("@LabResults", (object)referralData.LabResults ?? DBNull.Value);
            command.Parameters.AddWithValue("@InsuranceProvider", (object)referralData.InsuranceProvider ?? DBNull.Value);
            command.Parameters.AddWithValue("@PolicyNumber", (object)referralData.PolicyNumber ?? DBNull.Value);
            command.Parameters.AddWithValue("@GroupNumber", (object)referralData.GroupNumber ?? DBNull.Value);
            command.Parameters.AddWithValue("@UrgentFollowUp", referralData.UrgentFollowUp);
            command.Parameters.AddWithValue("@TransportationNeeded", referralData.TransportationNeeded);
            command.Parameters.AddWithValue("@InterpreterNeeded", referralData.InterpreterNeeded);
            command.Parameters.AddWithValue("@AdditionalNotes", (object)referralData.AdditionalNotes ?? DBNull.Value);
            command.Parameters.AddWithValue("@PhysicianName", (object)referralData.PhysicianName ?? DBNull.Value);
            command.Parameters.AddWithValue("@PhysicianLicense", (object)referralData.PhysicianLicense ?? DBNull.Value);
            command.Parameters.AddWithValue("@PhysicianPhone", (object)referralData.PhysicianPhone ?? DBNull.Value);
            command.Parameters.AddWithValue("@PhysicianSignature", (object)referralData.PhysicianSignature ?? DBNull.Value);

            var referralId = (int)await command.ExecuteScalarAsync();
            return Ok(new { ReferralID = referralId });
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
    public string ClinicalHistory { get; set; }
    public string CurrentDiagnosis { get; set; }
    public VitalSigns VitalSigns { get; set; }
    public string CurrentMedications { get; set; }
    public string Allergies { get; set; }
    public string LabResults { get; set; }
    public string InsuranceProvider { get; set; }
    public string PolicyNumber { get; set; }
    public string GroupNumber { get; set; }
    public bool UrgentFollowUp { get; set; }
    public bool TransportationNeeded { get; set; }
    public bool InterpreterNeeded { get; set; }
    public string AdditionalNotes { get; set; }
    public string PhysicianName { get; set; }
    public string PhysicianLicense { get; set; }
    public string PhysicianPhone { get; set; }
    public string PhysicianSignature { get; set; }
}

public class ReferralFormData
{
    public int PatientID { get; set; }
    public string CardNumber { get; set; }
    public Guid ReferringPhysician { get; set; }
    public string Department { get; set; }
    public string Notes { get; set; }
    public int? ReferenceID { get; set; }
    public Guid CreatedBy { get; set; }
    public string ClinicalHistory { get; set; }
    public string CurrentDiagnosis { get; set; }
    public VitalSigns VitalSigns { get; set; }
    public string CurrentMedications { get; set; }
    public string Allergies { get; set; }
    public string LabResults { get; set; }
    public string InsuranceProvider { get; set; }
    public string PolicyNumber { get; set; }
    public string GroupNumber { get; set; }
    public bool UrgentFollowUp { get; set; }
    public bool TransportationNeeded { get; set; }
    public bool InterpreterNeeded { get; set; }
    public string AdditionalNotes { get; set; }
    public string PhysicianName { get; set; }
    public string PhysicianLicense { get; set; }
    public string PhysicianPhone { get; set; }
    public string PhysicianSignature { get; set; }
}

public class VitalSigns
{
    public string BloodPressure { get; set; }
    public string HeartRate { get; set; }
    public string Temperature { get; set; }
    public string Weight { get; set; }
    public string Height { get; set; }
}