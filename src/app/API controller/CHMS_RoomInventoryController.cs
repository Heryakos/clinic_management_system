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
    public class CHMS_RoomInventoryController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_RoomInventoryController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet("items/room/{roomId}")]
        public async Task<ActionResult<IEnumerable<InventoryRoomItem>>> GetInventoryItemsByRoom(Guid roomId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetInventoryItemsByRoom]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RoomID", SqlDbType.UniqueIdentifier).Value = roomId;
                    await connection.OpenAsync();
                    var items = new List<InventoryRoomItem>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            items.Add(new InventoryRoomItem
                            {
                                ItemID = reader.GetInt32(reader.GetOrdinal("ItemID")),
                                ItemCode = reader.GetString(reader.GetOrdinal("ItemCode")),
                                ItemName = reader.GetString(reader.GetOrdinal("ItemName")),
                                CategoryID = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                                CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                                Unit = reader.GetString(reader.GetOrdinal("Unit")),
                                CurrentStock = reader.GetInt32(reader.GetOrdinal("CurrentStock")),
                                MinimumStock = reader.GetInt32(reader.GetOrdinal("MinimumStock")),
                                MaximumStock = reader.IsDBNull(reader.GetOrdinal("MaximumStock")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("MaximumStock")),
                                UnitPrice = reader.IsDBNull(reader.GetOrdinal("UnitPrice")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                                ExpiryDate = reader.IsDBNull(reader.GetOrdinal("ExpiryDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ExpiryDate")),
                                Manufacturer = reader.IsDBNull(reader.GetOrdinal("Manufacturer")) ? null : reader.GetString(reader.GetOrdinal("Manufacturer")),
                                BatchNumber = reader.IsDBNull(reader.GetOrdinal("BatchNumber")) ? null : reader.GetString(reader.GetOrdinal("BatchNumber")),
                                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                                CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                                UpdatedDate = reader.GetDateTime(reader.GetOrdinal("UpdatedDate")),
                                MaxQuantityAllowed = reader.IsDBNull(reader.GetOrdinal("MaxQuantityAllowed")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("MaxQuantityAllowed")),
                                StockStatus = reader.GetString(reader.GetOrdinal("StockStatus"))
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

        [HttpGet("supervisor/pending-requests")]
        public async Task<ActionResult<IEnumerable<InventoryRoomRequest>>> GetPendingRequestsForSupervisor()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetPendingRequestsForSupervisor]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    await connection.OpenAsync();
                    var requests = new List<InventoryRoomRequest>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            requests.Add(new InventoryRoomRequest
                            {
                                RequestID = reader.GetInt32(reader.GetOrdinal("RequestID")),
                                RequestNumber = reader.GetString(reader.GetOrdinal("RequestNumber")),
                                RequestedFrom = reader.GetString(reader.GetOrdinal("RequestedFrom")),
                                RoomID = reader.GetGuid(reader.GetOrdinal("RoomID")),
                                RoomName = reader.GetString(reader.GetOrdinal("RoomName")),
                                RequestDate = reader.GetDateTime(reader.GetOrdinal("RequestDate")),
                                ReasonForRequest = reader.GetString(reader.GetOrdinal("ReasonForRequest")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                RequestedByName = reader.GetString(reader.GetOrdinal("RequestedByName")),
                                ItemCount = reader.GetInt32(reader.GetOrdinal("ItemCount")),
                                EstimatedValue = reader.IsDBNull(reader.GetOrdinal("EstimatedValue")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("EstimatedValue"))
                            });
                        }
                    }

                    return Ok(requests);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving pending requests.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving pending requests.", error = ex.Message });
            }
        }

        [HttpGet("item-registrations/{id}")]
        public async Task<ActionResult<ItemRegistration>> GetItemRegistrations(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetItemRegistrations]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RegistrationID", SqlDbType.Int).Value = id;
                    await connection.OpenAsync();
                    ItemRegistration registration = null;

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            registration = new ItemRegistration
                            {
                                RegistrationID = reader.GetInt32(reader.GetOrdinal("RegistrationID")),
                                ItemID = reader.GetInt32(reader.GetOrdinal("ItemID")),
                                ItemName = reader.GetString(reader.GetOrdinal("ItemName")),
                                ItemCode = reader.GetString(reader.GetOrdinal("ItemCode")),
                                BatchNumber = reader.GetString(reader.GetOrdinal("BatchNumber")),
                                Manufacturer = reader.GetString(reader.GetOrdinal("Manufacturer")),
                                Supplier = reader.IsDBNull(reader.GetOrdinal("Supplier")) ? null : reader.GetString(reader.GetOrdinal("Supplier")),
                                ManufactureDate = reader.IsDBNull(reader.GetOrdinal("ManufactureDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ManufactureDate")),
                                ExpiryDate = reader.IsDBNull(reader.GetOrdinal("ExpiryDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ExpiryDate")),
                                Quantity = reader.GetInt32(reader.GetOrdinal("Quantity")),
                                UnitPrice = reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                                TotalCost = reader.GetDecimal(reader.GetOrdinal("TotalCost")),
                                PurchaseRequestID = reader.IsDBNull(reader.GetOrdinal("PurchaseRequestID")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("PurchaseRequestID")),
                                PurchaseRequestNumber = reader.IsDBNull(reader.GetOrdinal("PurchaseRequestNumber")) ? null : reader.GetString(reader.GetOrdinal("PurchaseRequestNumber")),
                                ReceivedDate = reader.GetDateTime(reader.GetOrdinal("ReceivedDate")),
                                ReceivedBy = reader.GetGuid(reader.GetOrdinal("ReceivedBy")),
                                ReceivedByName = reader.GetString(reader.GetOrdinal("ReceivedByName")),
                                QualityCheck = reader.GetBoolean(reader.GetOrdinal("QualityCheck")),
                                QualityCheckBy = reader.IsDBNull(reader.GetOrdinal("QualityCheckBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("QualityCheckBy")),
                                QualityCheckByName = reader.IsDBNull(reader.GetOrdinal("QualityCheckByName")) ? null : reader.GetString(reader.GetOrdinal("QualityCheckByName")),
                                QualityCheckDate = reader.IsDBNull(reader.GetOrdinal("QualityCheckDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("QualityCheckDate")),
                                QualityComments = reader.IsDBNull(reader.GetOrdinal("QualityComments")) ? null : reader.GetString(reader.GetOrdinal("QualityComments")),
                                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                            };
                        }
                    }

                    if (registration == null)
                    {
                        return NotFound(new { message = $"Item registration with ID {id} not found." });
                    }

                    return Ok(registration);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving the item registration.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the item registration.", error = ex.Message });
            }
        }
        [HttpGet("purchase-requests")]
        public async Task<ActionResult<IEnumerable<PurchaseRequest>>> GetPurchaseRequests()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetPurchaseRequests]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    await connection.OpenAsync();
                    var requests = new List<PurchaseRequest>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            requests.Add(new PurchaseRequest
                            {
                                PurchaseRequestID = reader.GetInt32(reader.GetOrdinal("PurchaseRequestID")),
                                RequestNumber = reader.GetString(reader.GetOrdinal("RequestNumber")),
                                OriginalRequestID = reader.GetInt32(reader.GetOrdinal("OriginalRequestID")),
                                ItemID = reader.GetInt32(reader.GetOrdinal("ItemID")),
                                ItemName = reader.GetString(reader.GetOrdinal("ItemName")),
                                ItemCode = reader.GetString(reader.GetOrdinal("ItemCode")),
                                Quantity = reader.GetInt32(reader.GetOrdinal("Quantity")),
                                EstimatedUnitPrice = reader.GetDecimal(reader.GetOrdinal("EstimatedUnitPrice")),
                                TotalEstimatedCost = reader.GetDecimal(reader.GetOrdinal("TotalEstimatedCost")),
                                RequestedBy = reader.GetGuid(reader.GetOrdinal("RequestedBy")),
                                RequestedByName = reader.GetString(reader.GetOrdinal("RequestedByName")),
                                RequestDate = reader.GetDateTime(reader.GetOrdinal("RequestDate")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                PurchasedBy = reader.IsDBNull(reader.GetOrdinal("PurchasedBy")) ? (Guid?)null : reader.GetGuid(reader.GetOrdinal("PurchasedBy")),
                                PurchasedByName = reader.IsDBNull(reader.GetOrdinal("PurchasedByName")) ? null : reader.GetString(reader.GetOrdinal("PurchasedByName")),
                                PurchaseDate = reader.IsDBNull(reader.GetOrdinal("PurchaseDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("PurchaseDate")),
                                ActualUnitPrice = reader.IsDBNull(reader.GetOrdinal("ActualUnitPrice")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("ActualUnitPrice")),
                                ActualTotalCost = reader.IsDBNull(reader.GetOrdinal("ActualTotalCost")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("ActualTotalCost")),
                                Supplier = reader.IsDBNull(reader.GetOrdinal("Supplier")) ? null : reader.GetString(reader.GetOrdinal("Supplier")),
                                Comments = reader.IsDBNull(reader.GetOrdinal("Comments")) ? null : reader.GetString(reader.GetOrdinal("Comments"))
                            });
                        }
                    }

                    return Ok(requests);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving purchase requests.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving purchase requests.", error = ex.Message });
            }
        }

        [HttpPut("requests/{requestId}/status")]
        public async Task<ActionResult> UpdateRequestStatus(int requestId, [FromBody] UpdateRequestStatusModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Status) || model.ApprovedBy == Guid.Empty)
            {
                return BadRequest(new { message = "Status and ApprovedBy are required." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_UpdateRequestStatus]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestID", SqlDbType.Int).Value = requestId;
                    command.Parameters.Add("@Status", SqlDbType.NVarChar).Value = model.Status;
                    command.Parameters.Add("@ApprovedBy", SqlDbType.UniqueIdentifier).Value = model.ApprovedBy;
                    command.Parameters.Add("@Comments", SqlDbType.NVarChar).Value = (object?)model.Comments ?? DBNull.Value;

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return Ok(new { message = "Request status updated successfully." });
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while updating request status.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating request status.", error = ex.Message });
            }
        }

        [HttpPost("purchase-requests")]
        public async Task<ActionResult<PurchaseRequest>> CreatePurchaseRequest([FromBody] PurchaseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RequestNumber) || request.ItemID <= 0 || request.Quantity <= 0 || request.RequestedBy == Guid.Empty)
            {
                return BadRequest(new { message = "RequestNumber, ItemID, Quantity, and RequestedBy are required." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_CreatePurchaseRequest]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestNumber", SqlDbType.NVarChar).Value = request.RequestNumber;
                    command.Parameters.Add("@OriginalRequestID", SqlDbType.Int).Value = request.OriginalRequestID;
                    command.Parameters.Add("@ItemID", SqlDbType.Int).Value = request.ItemID;
                    command.Parameters.Add("@Quantity", SqlDbType.Int).Value = request.Quantity;
                    command.Parameters.Add("@EstimatedUnitPrice", SqlDbType.Decimal).Value = request.EstimatedUnitPrice;
                    command.Parameters.Add("@RequestedBy", SqlDbType.UniqueIdentifier).Value = request.RequestedBy;
                    var purchaseRequestIdParam = new SqlParameter("@PurchaseRequestID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(purchaseRequestIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    request.PurchaseRequestID = (int)purchaseRequestIdParam.Value;
                    return CreatedAtAction(nameof(GetPurchaseRequests), new { id = request.PurchaseRequestID }, request);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the purchase request.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the purchase request.", error = ex.Message });
            }
        }

        [HttpPost("register-received-item")]
        public async Task<ActionResult<ItemRegistration>> RegisterReceivedItem([FromBody] ItemRegistration registration)
        {
            if (registration.ItemID <= 0 || string.IsNullOrWhiteSpace(registration.BatchNumber) ||
                string.IsNullOrWhiteSpace(registration.Manufacturer) || string.IsNullOrWhiteSpace(registration.Supplier) ||
                registration.Quantity <= 0 || registration.ReceivedBy == Guid.Empty)
            {
                return BadRequest(new { message = "ItemID, BatchNumber, Manufacturer, Supplier, Quantity, and ReceivedBy are required." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_RegisterReceivedItem]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@ItemID", SqlDbType.Int).Value = registration.ItemID;
                    command.Parameters.Add("@BatchNumber", SqlDbType.NVarChar).Value = registration.BatchNumber;
                    command.Parameters.Add("@Manufacturer", SqlDbType.NVarChar).Value = registration.Manufacturer;
                    command.Parameters.Add("@Supplier", SqlDbType.NVarChar).Value = registration.Supplier;
                    command.Parameters.Add("@ManufactureDate", SqlDbType.Date).Value = registration.ManufactureDate;
                    command.Parameters.Add("@ExpiryDate", SqlDbType.Date).Value = registration.ExpiryDate;
                    command.Parameters.Add("@Quantity", SqlDbType.Int).Value = registration.Quantity;
                    command.Parameters.Add("@UnitPrice", SqlDbType.Decimal).Value = registration.UnitPrice;
                    command.Parameters.Add("@PurchaseRequestID", SqlDbType.Int).Value = (object?)registration.PurchaseRequestID ?? DBNull.Value;
                    command.Parameters.Add("@ReceivedBy", SqlDbType.UniqueIdentifier).Value = registration.ReceivedBy;
                    var registrationIdParam = new SqlParameter("@RegistrationID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(registrationIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    registration.RegistrationID = (int)registrationIdParam.Value;
                    return CreatedAtAction(nameof(GetItemRegistrations), new { id = registration.RegistrationID }, registration);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while registering the received item.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while registering the received item.", error = ex.Message });
            }
        }

        // Placeholder for GetPurchaseRequests (for CreatedAtAction)
        //[HttpGet("purchase-requests/{id}")]
        //public async Task<ActionResult<PurchaseRequest>> GetPurchaseRequests(int id)
        //{
        //    return NotFound(new { message = "GetPurchaseRequests endpoint not implemented." });
        //}

        //// Placeholder for GetItemRegistrations (for CreatedAtAction)
        //[HttpGet("item-registrations/{id}")]
        //public async Task<ActionResult<ItemRegistration>> GetItemRegistrations(int id)
        //{
        //    return NotFound(new { message = "GetItemRegistrations endpoint not implemented." });
        //}
    }
}