using HospitalManagementSystem.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;

namespace HospitalManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CHMS_InventoryController : ControllerBase
    {
        private readonly string _connectionString;

        public CHMS_InventoryController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("XOKADatabase");
        }

        [HttpGet("items")]
        public async Task<IActionResult> GetInventoryItems()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand("SELECT * FROM [CHMS].vw_InventoryItems WHERE IsActive = 1 ORDER BY ItemName", connection);

                var results = new List<Dictionary<string, object>>(capacity: 100);

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var columnName = reader.GetName(i);
                        var value = await reader.IsDBNullAsync(i) ? null : reader.GetValue(i);
                        row[columnName] = value;
                    }

                    results.Add(row);
                }

                // Group dynamically by "CategoryID" if it exists
                if (results.Count > 0 && results[0].ContainsKey("CategoryID"))
                {
                    var grouped = results
                        .Where(r => r["CategoryID"] != null)
                        .GroupBy(r => r["CategoryID"])
                        .Select(g => new
                        {
                            categoryID = g.Key,
                            items = g.ToList()
                        })
                        .ToList();

                    return Ok(grouped);
                }

                // Fallback if "CategoryID" is missing
                return Ok(results);
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving inventory items.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving inventory items.", error = ex.Message });
            }
        }
        [HttpGet("items/room/{roomId}")]
        public async Task<IActionResult> GetInventoryItemsByRoom(string roomId)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var command = new SqlCommand(
                    "SELECT * FROM [CHMS].[vw_InventoryItems] WHERE IsActive = 1 AND RoomID = @RoomID ORDER BY ItemName",
                    connection);
                command.Parameters.AddWithValue("@RoomID", roomId);

                var results = new List<Dictionary<string, object>>(capacity: 100);

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var columnName = reader.GetName(i);
                        var value = await reader.IsDBNullAsync(i) ? null : reader.GetValue(i);
                        row[columnName] = value;
                    }
                    results.Add(row);
                }

                if (results.Count > 0 && results[0].ContainsKey("CategoryID"))
                {
                    var grouped = results
                        .Where(r => r["CategoryID"] != null)
                        .GroupBy(r => r["CategoryID"])
                        .Select(g => new
                        {
                            categoryID = g.Key,
                            items = g.ToList()
                        })
                        .ToList();

                    return Ok(grouped);
                }

                return Ok(results);
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving inventory items for room.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving inventory items for room.", error = ex.Message });
            }
        }


        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<InventoryCategory>>> GetInventoryCategories()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].InventoryCategories WHERE IsActive = 1 ORDER BY CategoryName", connection))
                {
                    await connection.OpenAsync();
                    var categories = new List<InventoryCategory>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            categories.Add(new InventoryCategory
                            {
                                CategoryID = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                                CategoryName = reader.GetString(reader.GetOrdinal("CategoryName")),
                                Description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                            });
                        }
                    }

                    return Ok(categories);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving inventory categories.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving inventory categories.", error = ex.Message });
            }
        }

        [HttpGet("room-categories/{roomId}")]
        public async Task<ActionResult<IEnumerable<RoomCategory>>> GetRoomCategories(Guid roomId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetRoomCategories]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RoomID", SqlDbType.UniqueIdentifier).Value = roomId;
                    await connection.OpenAsync();
                    var categories = new List<RoomCategory>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            categories.Add(new RoomCategory
                            {
                                CategoryID = reader.GetInt32(reader.GetOrdinal("CategoryID")),
                                RoomName = reader.GetString(reader.GetOrdinal("RoomName")),
                                IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                            });
                        }
                    }

                    return Ok(categories);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving room categories.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving room categories.", error = ex.Message });
            }
        }

        [HttpGet("requests")]
        public async Task<ActionResult<IEnumerable<InventoryRequest>>> GetInventoryRequests()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT * FROM [CHMS].vw_InventoryRequests ORDER BY RequestDate DESC", connection))
                {
                    await connection.OpenAsync();
                    var requests = new List<InventoryRequest>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            requests.Add(new InventoryRequest
                            {
                                RequestID = reader.GetInt32(reader.GetOrdinal("RequestID")),
                                RequestNumber = reader.GetString(reader.GetOrdinal("RequestNumber")),
                                RequestedFrom = reader.GetString(reader.GetOrdinal("RequestedFrom")),
                                RequestedBy = reader.GetGuid(reader.GetOrdinal("RequestedBy")),
                                RequestDate = reader.GetDateTime(reader.GetOrdinal("RequestDate")),
                                ReasonForRequest = reader.GetString(reader.GetOrdinal("ReasonForRequest")),
                                Status = reader.GetString(reader.GetOrdinal("Status")),
                                ApprovedBy = reader.IsDBNull(reader.GetOrdinal("ApprovedBy")) ? null : (Guid?)reader.GetGuid(reader.GetOrdinal("ApprovedBy")),
                                ApprovedDate = reader.IsDBNull(reader.GetOrdinal("ApprovedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ApprovedDate")),
                                IssuedBy = reader.IsDBNull(reader.GetOrdinal("IssuedBy")) ? null : (Guid?)reader.GetGuid(reader.GetOrdinal("IssuedBy")),
                                IssuedDate = reader.IsDBNull(reader.GetOrdinal("IssuedDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("IssuedDate")),
                                Comments = reader.IsDBNull(reader.GetOrdinal("Comments")) ? null : reader.GetString(reader.GetOrdinal("Comments"))
                            });
                        }
                    }

                    return Ok(requests);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving inventory requests.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving inventory requests.", error = ex.Message });
            }
        }

       

        [HttpGet("requests/{requestId}/details")]
        public async Task<ActionResult<IEnumerable<InventoryRequestDetail>>> GetRequestDetails(int requestId)
        {
            if (requestId <= 0)
                return BadRequest(new { message = "Invalid Request ID." });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand(
                    @"SELECT ird.*, ii.ItemName, ii.Unit, ii.UnitPrice
                      FROM [CHMS].InventoryRequestDetails ird
                      INNER JOIN [CHMS].InventoryItems ii ON ird.ItemID = ii.ItemID
                      WHERE ird.RequestID = @RequestID", connection))
                {
                    command.Parameters.Add("@RequestID", SqlDbType.Int).Value = requestId;
                    await connection.OpenAsync();
                    var details = new List<InventoryRequestDetail>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            details.Add(new InventoryRequestDetail
                            {
                                DetailID = reader.GetInt32(reader.GetOrdinal("DetailID")),
                                RequestID = reader.GetInt32(reader.GetOrdinal("RequestID")),
                                ItemID = reader.GetInt32(reader.GetOrdinal("ItemID")),
                                RequestedQuantity = reader.GetInt32(reader.GetOrdinal("RequestedQuantity")),
                                ApprovedQuantity = reader.GetInt32(reader.GetOrdinal("ApprovedQuantity")),
                                IssuedQuantity = reader.GetInt32(reader.GetOrdinal("IssuedQuantity")),
                                JobOrderNumber = reader.IsDBNull(reader.GetOrdinal("JobOrderNumber")) ? null : reader.GetString(reader.GetOrdinal("JobOrderNumber"))
                            });
                        }
                    }

                    return Ok(details);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving request details.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving request details.", error = ex.Message });
            }
        }

        

        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<InventoryItem>>> GetLowStockItems()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_GetLowStockItems", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
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
                                CurrentStock = reader.GetInt32(reader.GetOrdinal("CurrentStock")),
                                MinimumStock = reader.GetInt32(reader.GetOrdinal("MinimumStock")),
                                Unit = reader.GetString(reader.GetOrdinal("Unit")),
                                UnitPrice = reader.IsDBNull(reader.GetOrdinal("UnitPrice")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("UnitPrice"))
                            });
                        }
                    }

                    return Ok(items);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving low stock items.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving low stock items.", error = ex.Message });
            }
        }
        [HttpGet("reports/{type}")]
        public async Task<ActionResult> GetReports(string type)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetInventoryReports]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@ReportType", SqlDbType.NVarChar).Value = type;
                    await connection.OpenAsync();
                    var reports = new List<object>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var report = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                report[reader.GetName(i)] = reader.GetValue(i);
                            }
                            reports.Add(report);
                        }
                    }

                    return Ok(reports);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating report.", error = ex.Message });
            }
        }

        [HttpGet("room-stock/{roomId}")]
        public async Task<ActionResult> GetRoomStock(Guid roomId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_GetRoomStock]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RoomID", SqlDbType.UniqueIdentifier).Value = roomId;
                    await connection.OpenAsync();
                    var stock = new List<RoomStock>();

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            stock.Add(new RoomStock
                            {
                                RoomStockID = reader.GetInt32("RoomStockID"),
                                RoomID = reader.GetGuid("RoomID"),
                                ItemID = reader.GetInt32("ItemID"),
                                CurrentStock = reader.GetInt32("CurrentStock")
                                // Add more fields as per view
                            });
                        }
                    }

                    return Ok(stock);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error getting room stock.", error = ex.Message });
            }
        }

        [HttpGet("near-expiry")]
        public async Task<ActionResult<IEnumerable<InventoryItem>>> GetNearExpiryItems()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_GetNearExpiryItems", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@DaysAhead", SqlDbType.Int).Value = 90;

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
                                CurrentStock = reader.GetInt32(reader.GetOrdinal("CurrentStock")),
                                ExpiryDate = reader.IsDBNull(reader.GetOrdinal("ExpiryDate")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("ExpiryDate")),
                                UnitPrice = reader.IsDBNull(reader.GetOrdinal("UnitPrice")) ? (decimal?)null : reader.GetDecimal(reader.GetOrdinal("UnitPrice"))
                            });
                        }
                    }

                    return Ok(items);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while retrieving near expiry items.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving near expiry items.", error = ex.Message });
            }
        }

        [HttpPost("requests")]
        public async Task<ActionResult<InventoryRequest>> CreateInventoryRequest([FromBody] InventoryRequest request)
        {
            //if (request == null || string.IsNullOrWhiteSpace(request.RequestNumber) ||
            //    string.IsNullOrWhiteSpace(request.RequestedFrom) || request.RequestedBy <= 0 ||
            //    string.IsNullOrWhiteSpace(request.ReasonForRequest))
            //{
            //    return BadRequest(new { message = "Request data is incomplete. Required fields: RequestNumber, RequestedFrom, RequestedBy, ReasonForRequest." });
            //}

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_CreateInventoryRequest", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestNumber", SqlDbType.NVarChar).Value = request.RequestNumber;
                    command.Parameters.Add("@RequestedFrom", SqlDbType.NVarChar).Value = request.RequestedFrom;
                    command.Parameters.Add("@RequestedBy", SqlDbType.Int).Value = request.RequestedBy;
                    command.Parameters.Add("@ReasonForRequest", SqlDbType.NVarChar).Value = request.ReasonForRequest;
                    var requestIdParam = new SqlParameter("@RequestID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(requestIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    request.RequestID = (int)requestIdParam.Value;
                    return CreatedAtAction(nameof(GetInventoryRequests), new { id = request.RequestID }, request);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the inventory request.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the inventory request.", error = ex.Message });
            }
        }

        [HttpPost("requests/{requestId}/details")]
        public async Task<ActionResult<InventoryRequestDetail>> AddRequestDetail(int requestId, [FromBody] InventoryRequestDetail detail)
        {
            if (requestId <= 0 || detail == null || detail.ItemID <= 0 || detail.RequestedQuantity <= 0)
            {
                return BadRequest(new { message = "Detail data is incomplete. Required fields: ItemID, RequestedQuantity." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].sp_AddInventoryRequestDetails", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestID", SqlDbType.Int).Value = requestId;
                    command.Parameters.Add("@ItemID", SqlDbType.Int).Value = detail.ItemID;
                    command.Parameters.Add("@RequestedQuantity", SqlDbType.Int).Value = detail.RequestedQuantity;
                    command.Parameters.Add("@JobOrderNumber", SqlDbType.NVarChar).Value = (object?)detail.JobOrderNumber ?? DBNull.Value;
                    var detailIdParam = new SqlParameter("@DetailID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    command.Parameters.Add(detailIdParam);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    detail.DetailID = (int)detailIdParam.Value;
                    detail.RequestID = requestId;
                    return CreatedAtAction(nameof(GetRequestDetails), new { requestId = requestId }, detail);
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while adding request detail.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding request detail.", error = ex.Message });
            }
        }

        [HttpPost("requests/enhanced")]
        public async Task<ActionResult> CreateInventoryRequestEnhanced([FromBody] InventoryRequestEnhanced request)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.RequestNumber) ||
                string.IsNullOrWhiteSpace(request.RequestedFrom) ||
                request.RoomID == Guid.Empty ||
                request.RequestedBy == Guid.Empty ||
                string.IsNullOrWhiteSpace(request.ReasonForRequest) ||
                request.Items == null || !request.Items.Any())
            {
                return BadRequest(new { message = "Request data is incomplete. Required fields: RequestNumber, RequestedFrom, RoomID, RequestedBy, ReasonForRequest, Items." });
            }

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand("[CHMS].[sp_CreateInventoryRequest]", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@RequestNumber", request.RequestNumber);
                        command.Parameters.AddWithValue("@RequestedFrom", request.RequestedFrom);
                        command.Parameters.AddWithValue("@RoomID", request.RoomID);
                        command.Parameters.AddWithValue("@RequestedBy", request.RequestedBy);
                        command.Parameters.AddWithValue("@RequestDate", request.RequestDate);
                        command.Parameters.AddWithValue("@ReasonForRequest", request.ReasonForRequest);
                        command.Parameters.AddWithValue("@Status", request.Status ?? "Pending");
                        command.Parameters.AddWithValue("@Items", JsonSerializer.Serialize(request.Items));
                        var newRequestIdParam = new SqlParameter("@NewRequestID", SqlDbType.Int) { Direction = ParameterDirection.Output };
                        command.Parameters.Add(newRequestIdParam);

                        await command.ExecuteNonQueryAsync();

                        int newRequestId = (int)newRequestIdParam.Value;
                        return Ok(new
                        {
                            RequestID = newRequestId,
                            Message = "Inventory request created successfully"
                        });
                    }
                }
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new { message = "A database error occurred while creating the inventory request.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the inventory request.", error = ex.Message });
            }
        }

        [HttpPost("receive-items")]
        public async Task<ActionResult> ReceiveItems([FromBody] ReceiveModel model)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_ReceiveItems]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@PurchaseRequestID", SqlDbType.Int).Value = model.PurchaseRequestID;
                    command.Parameters.Add("@ReceivedBy", SqlDbType.UniqueIdentifier).Value = model.ReceivedBy;
                    command.Parameters.Add("@BatchNumber", SqlDbType.NVarChar).Value = model.BatchNumber;
                    command.Parameters.Add("@Manufacturer", SqlDbType.NVarChar).Value = model.Manufacturer;
                    command.Parameters.Add("@Supplier", SqlDbType.NVarChar).Value = model.Supplier;
                    command.Parameters.Add("@ManufactureDate", SqlDbType.Date).Value = model.ManufactureDate.HasValue ? model.ManufactureDate.Value : (object)DBNull.Value;
                    command.Parameters.Add("@ExpiryDate", SqlDbType.Date).Value = model.ExpiryDate.HasValue ? model.ExpiryDate.Value : (object)DBNull.Value;
                    command.Parameters.Add("@Quantity", SqlDbType.Int).Value = model.Quantity;
                    command.Parameters.Add("@UnitPrice", SqlDbType.Decimal).Value = model.UnitPrice;
                    command.Parameters.Add("@QualityCheck", SqlDbType.Bit).Value = model.QualityCheck;
                    command.Parameters.Add("@QualityComments", SqlDbType.NVarChar).Value = string.IsNullOrEmpty(model.QualityComments) ? (object)DBNull.Value : model.QualityComments;

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return Ok(new { message = "Items received successfully." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error receiving items.", error = ex.Message });
            }
        }
        [HttpPut("requests/{requestId}/approve")]
        public async Task<ActionResult> ApproveRequest(int requestId, [FromBody] ApprovalModel model)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_UpdateRequestStatus]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestID", SqlDbType.Int).Value = requestId;
                    command.Parameters.Add("@Status", SqlDbType.NVarChar).Value = "Approved";
                    command.Parameters.Add("@ApprovedBy", SqlDbType.UniqueIdentifier).Value = model.ApprovedBy;
                    command.Parameters.Add("@Comments", SqlDbType.NVarChar).Value = string.IsNullOrEmpty(model.Comments) ? (object)DBNull.Value : model.Comments;

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return Ok(new { message = "Request approved successfully." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error approving request.", error = ex.Message });
            }
        }

        [HttpPut("requests/{requestId}/reject")]
        public async Task<ActionResult> RejectRequest(int requestId, [FromBody] ApprovalModel model)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_UpdateRequestStatus]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestID", SqlDbType.Int).Value = requestId;
                    command.Parameters.Add("@Status", SqlDbType.NVarChar).Value = "Rejected";
                    command.Parameters.Add("@ApprovedBy", SqlDbType.UniqueIdentifier).Value = model.ApprovedBy;
                    command.Parameters.Add("@Comments", SqlDbType.NVarChar).Value = string.IsNullOrEmpty(model.Comments) ? (object)DBNull.Value : model.Comments;

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return Ok(new { message = "Request rejected successfully." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error rejecting request.", error = ex.Message });
            }
        }

        [HttpPut("requests/{requestId}/issue")]
        public async Task<ActionResult> IssueRequest(int requestId, [FromBody] IssueModel model)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_IssueItems]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestID", SqlDbType.Int).Value = requestId;
                    command.Parameters.Add("@IssuedBy", SqlDbType.UniqueIdentifier).Value = model.IssuedBy;
                    command.Parameters.Add("@Comments", SqlDbType.NVarChar).Value = string.IsNullOrEmpty(model.Comments) ? (object)DBNull.Value : model.Comments;

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return Ok(new { message = "Items issued successfully." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error issuing items.", error = ex.Message });
            }
        }
        [HttpPut("requests/{requestId}/receive")]
        public async Task<ActionResult> ConfirmReceipt(int requestId, [FromBody] ReceiptModel model)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("[CHMS].[sp_ConfirmReceipt]", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.Add("@RequestID", SqlDbType.Int).Value = requestId;
                    command.Parameters.Add("@ReceivedBy", SqlDbType.UniqueIdentifier).Value = model.ReceivedBy;
                    command.Parameters.Add("@Comments", SqlDbType.NVarChar).Value = string.IsNullOrEmpty(model.Comments)? (object)DBNull.Value: model.Comments;


                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    return Ok(new { message = "Receipt confirmed successfully." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error confirming receipt.", error = ex.Message });
            }
        }
    }
    }