-- Procedure Room Stored Procedures

USE [xokaERP]
GO

-- =============================================
-- Wound Care Procedures
-- =============================================

-- Create Wound Care Procedure
CREATE PROCEDURE [CHMS].[sp_CreateWoundCare]
    @WoundCareNumber NVARCHAR(50),
    @PatientID INT,
    @CardNumber NVARCHAR(50),
    @OrderingPhysicianID UNIQUEIDENTIFIER,
    @WoundType NVARCHAR(100),
    @WoundLocation NVARCHAR(200),
    @WoundSize NVARCHAR(50),
    @WoundDepth NVARCHAR(50),
    @WoundCondition NVARCHAR(200),
    @TreatmentPlan NVARCHAR(500),
    @DressingType NVARCHAR(100),
    @CleaningSolution NVARCHAR(100),
    @Instructions NVARCHAR(500) = NULL,
    @Notes NVARCHAR(500) = NULL,
    @CreatedBy UNIQUEIDENTIFIER,
    @IsRecurring BIT = 0,
    @Frequency NVARCHAR(50) = NULL,
    @TotalSessions INT = NULL,
    @WoundCareID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate inputs
        IF EXISTS (SELECT 1 FROM CHMS.WoundCare WHERE WoundCareNumber = @WoundCareNumber)
        BEGIN
            THROW 50001, 'Wound care number already exists.', 1;
        END

        IF NOT EXISTS (SELECT 1 FROM CHMS.Patients WHERE PatientID = @PatientID)
        BEGIN
            THROW 50002, 'Invalid PatientID.', 1;
        END

        -- Insert wound care record
        INSERT INTO CHMS.WoundCare (
            WoundCareNumber, PatientID, CardNumber, OrderingPhysicianID,
            WoundType, WoundLocation, WoundSize, WoundDepth, WoundCondition,
            TreatmentPlan, DressingType, CleaningSolution, Instructions, Notes,
            ProcedureDate, Status, CreatedBy, IsRecurring, Frequency, TotalSessions
        )
        VALUES (
            @WoundCareNumber, @PatientID, @CardNumber, @OrderingPhysicianID,
            @WoundType, @WoundLocation, @WoundSize, @WoundDepth, @WoundCondition,
            @TreatmentPlan, @DressingType, @CleaningSolution, @Instructions, @Notes,
            GETDATE(), 'Pending', @CreatedBy, @IsRecurring, @Frequency, @TotalSessions
        );

        SET @WoundCareID = SCOPE_IDENTITY();

        -- Create schedules if recurring
        IF @IsRecurring = 1 AND @TotalSessions > 1
        BEGIN
            DECLARE @CurrentDate DATETIME = GETDATE();
            DECLARE @ScheduleCount INT = 0;
            DECLARE @IntervalDays INT = 1; -- Default to daily

            -- Determine interval based on frequency
            IF @Frequency LIKE '%daily%'
                SET @IntervalDays = 1;
            ELSE IF @Frequency LIKE '%weekly%'
                SET @IntervalDays = 7;
            ELSE IF @Frequency LIKE '%bi-weekly%'
                SET @IntervalDays = 14;

            -- Generate schedules
            WHILE @ScheduleCount < @TotalSessions
            BEGIN
                INSERT INTO CHMS.ProcedureSchedules (
                    ProcedureID, ProcedureType, ScheduledDate, ScheduledTime, Status, CreatedDate
                )
                VALUES (
                    @WoundCareID, 'WoundCare', @CurrentDate,
                    CONVERT(VARCHAR(5), @CurrentDate, 108), 'Pending', GETDATE()
                );

                SET @ScheduleCount = @ScheduleCount + 1;
                SET @CurrentDate = DATEADD(DAY, @IntervalDays, @CurrentDate);
            END
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Get Patient Wound Care Procedures
CREATE PROCEDURE [CHMS].[sp_GetPatientWoundCare]
    @PatientID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        w.WoundCareID, w.WoundCareNumber, w.ProcedureDate, w.Status,
        w.PatientID, p.CardNumber, p.FirstName + ' ' + p.LastName AS FullName,
        p.Gender, p.Age, p.Weight, p.Woreda, p.HouseNumber AS HouseNo, p.Phone,
        w.WoundType, w.WoundLocation, w.WoundSize, w.WoundDepth, w.WoundCondition,
        w.TreatmentPlan, w.DressingType, w.CleaningSolution,
        w.OrderingPhysicianID, u.UserName AS OrderingPhysicianName,
        w.PerformedBy, u2.UserName AS PerformedByName, w.PerformedDate,
        w.IsRecurring, w.Frequency, w.TotalSessions, w.CompletedSessions,
        w.Instructions, w.Notes, w.CreatedDate
    FROM CHMS.WoundCare w
    INNER JOIN CHMS.Patients p ON w.PatientID = p.PatientID
    LEFT JOIN dbo.aspnet_Users u ON w.OrderingPhysicianID = u.UserId
    LEFT JOIN dbo.aspnet_Users u2 ON w.PerformedBy = u2.UserId
    WHERE w.PatientID = @PatientID
    ORDER BY w.CreatedDate DESC;
END
GO

-- =============================================
-- Suturing Procedures
-- =============================================

-- Create Suturing Procedure
CREATE PROCEDURE [CHMS].[sp_CreateSuturing]
    @SuturingNumber NVARCHAR(50),
    @PatientID INT,
    @CardNumber NVARCHAR(50),
    @OrderingPhysicianID UNIQUEIDENTIFIER,
    @WoundType NVARCHAR(100),
    @WoundLocation NVARCHAR(200),
    @WoundSize NVARCHAR(50),
    @WoundDepth NVARCHAR(50),
    @SutureType NVARCHAR(100),
    @SutureMaterial NVARCHAR(100),
    @SutureSize NVARCHAR(50),
    @NumStitches INT,
    @AnesthesiaUsed NVARCHAR(100) = NULL,
    @Instructions NVARCHAR(500) = NULL,
    @Notes NVARCHAR(500) = NULL,
    @CreatedBy UNIQUEIDENTIFIER,
    @FollowUpRequired BIT = 0,
    @FollowUpDate DATETIME = NULL,
    @SuturingID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate inputs
        IF EXISTS (SELECT 1 FROM CHMS.Suturing WHERE SuturingNumber = @SuturingNumber)
        BEGIN
            THROW 50001, 'Suturing number already exists.', 1;
        END

        IF NOT EXISTS (SELECT 1 FROM CHMS.Patients WHERE PatientID = @PatientID)
        BEGIN
            THROW 50002, 'Invalid PatientID.', 1;
        END

        -- Insert suturing record
        INSERT INTO CHMS.Suturing (
            SuturingNumber, PatientID, CardNumber, OrderingPhysicianID,
            WoundType, WoundLocation, WoundSize, WoundDepth, SutureType,
            SutureMaterial, SutureSize, NumStitches, AnesthesiaUsed,
            Instructions, Notes, ProcedureDate, Status, CreatedBy,
            FollowUpRequired, FollowUpDate
        )
        VALUES (
            @SuturingNumber, @PatientID, @CardNumber, @OrderingPhysicianID,
            @WoundType, @WoundLocation, @WoundSize, @WoundDepth, @SutureType,
            @SutureMaterial, @SutureSize, @NumStitches, @AnesthesiaUsed,
            @Instructions, @Notes, GETDATE(), 'Pending', @CreatedBy,
            @FollowUpRequired, @FollowUpDate
        );

        SET @SuturingID = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Get Patient Suturing Procedures
CREATE PROCEDURE [CHMS].[sp_GetPatientSuturing]
    @PatientID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.SuturingID, s.SuturingNumber, s.ProcedureDate, s.Status,
        s.PatientID, p.CardNumber, p.FirstName + ' ' + p.LastName AS FullName,
        p.Gender, p.Age, p.Weight, p.Woreda, p.HouseNumber AS HouseNo, p.Phone,
        s.WoundType, s.WoundLocation, s.WoundSize, s.WoundDepth,
        s.SutureType, s.SutureMaterial, s.SutureSize, s.NumStitches, s.AnesthesiaUsed,
        s.OrderingPhysicianID, u.UserName AS OrderingPhysicianName,
        s.PerformedBy, u2.UserName AS PerformedByName, s.PerformedDate,
        s.FollowUpRequired, s.FollowUpDate, s.RemovalDate,
        s.Instructions, s.Notes, s.CreatedDate
    FROM CHMS.Suturing s
    INNER JOIN CHMS.Patients p ON s.PatientID = p.PatientID
    LEFT JOIN dbo.aspnet_Users u ON s.OrderingPhysicianID = u.UserId
    LEFT JOIN dbo.aspnet_Users u2 ON s.PerformedBy = u2.UserId
    WHERE s.PatientID = @PatientID
    ORDER BY s.CreatedDate DESC;
END
GO

-- =============================================
-- Ear Irrigation Procedures
-- =============================================

-- Create Ear Irrigation Procedure
CREATE PROCEDURE [CHMS].[sp_CreateEarIrrigation]
    @EarIrrigationNumber NVARCHAR(50),
    @PatientID INT,
    @CardNumber NVARCHAR(50),
    @OrderingPhysicianID UNIQUEIDENTIFIER,
    @EarSide NVARCHAR(10),
    @IrrigationSolution NVARCHAR(100),
    @SolutionTemperature NVARCHAR(50),
    @IrrigationPressure NVARCHAR(50),
    @ProcedureDuration INT,
    @Findings NVARCHAR(500) = NULL,
    @Complications NVARCHAR(500) = NULL,
    @Instructions NVARCHAR(500) = NULL,
    @Notes NVARCHAR(500) = NULL,
    @CreatedBy UNIQUEIDENTIFIER,
    @FollowUpRequired BIT = 0,
    @FollowUpDate DATETIME = NULL,
    @EarIrrigationID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate inputs
        IF EXISTS (SELECT 1 FROM CHMS.EarIrrigation WHERE EarIrrigationNumber = @EarIrrigationNumber)
        BEGIN
            THROW 50001, 'Ear irrigation number already exists.', 1;
        END

        IF NOT EXISTS (SELECT 1 FROM CHMS.Patients WHERE PatientID = @PatientID)
        BEGIN
            THROW 50002, 'Invalid PatientID.', 1;
        END

        -- Insert ear irrigation record
        INSERT INTO CHMS.EarIrrigation (
            EarIrrigationNumber, PatientID, CardNumber, OrderingPhysicianID,
            EarSide, IrrigationSolution, SolutionTemperature, IrrigationPressure,
            ProcedureDuration, Findings, Complications, Instructions, Notes,
            ProcedureDate, Status, CreatedBy, FollowUpRequired, FollowUpDate
        )
        VALUES (
            @EarIrrigationNumber, @PatientID, @CardNumber, @OrderingPhysicianID,
            @EarSide, @IrrigationSolution, @SolutionTemperature, @IrrigationPressure,
            @ProcedureDuration, @Findings, @Complications, @Instructions, @Notes,
            GETDATE(), 'Pending', @CreatedBy, @FollowUpRequired, @FollowUpDate
        );

        SET @EarIrrigationID = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Get Patient Ear Irrigation Procedures
CREATE PROCEDURE [CHMS].[sp_GetPatientEarIrrigation]
    @PatientID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.EarIrrigationID, e.EarIrrigationNumber, e.ProcedureDate, e.Status,
        e.PatientID, p.CardNumber, p.FirstName + ' ' + p.LastName AS FullName,
        p.Gender, p.Age, p.Weight, p.Woreda, p.HouseNumber AS HouseNo, p.Phone,
        e.EarSide, e.IrrigationSolution, e.SolutionTemperature, e.IrrigationPressure,
        e.ProcedureDuration, e.Findings, e.Complications,
        e.OrderingPhysicianID, u.UserName AS OrderingPhysicianName,
        e.PerformedBy, u2.UserName AS PerformedByName, e.PerformedDate,
        e.FollowUpRequired, e.FollowUpDate,
        e.Instructions, e.Notes, e.CreatedDate
    FROM CHMS.EarIrrigation e
    INNER JOIN CHMS.Patients p ON e.PatientID = p.PatientID
    LEFT JOIN dbo.aspnet_Users u ON e.OrderingPhysicianID = u.UserId
    LEFT JOIN dbo.aspnet_Users u2 ON e.PerformedBy = u2.UserId
    WHERE e.PatientID = @PatientID
    ORDER BY e.CreatedDate DESC;
END
GO

-- =============================================
-- Generic Procedure Administration
-- =============================================

-- Administer Procedure
CREATE PROCEDURE [CHMS].[sp_AdministerProcedure]
    @ProcedureID INT,
    @ProcedureType NVARCHAR(50),
    @PerformedBy UNIQUEIDENTIFIER,
    @PerformedDate DATETIME,
    @Notes NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @ProcedureType = 'WoundCare'
        BEGIN
            UPDATE CHMS.WoundCare
            SET Status = 'Completed',
                PerformedBy = @PerformedBy,
                PerformedDate = @PerformedDate,
                Notes = ISNULL(@Notes, Notes)
            WHERE WoundCareID = @ProcedureID;
        END
        ELSE IF @ProcedureType = 'Suturing'
        BEGIN
            UPDATE CHMS.Suturing
            SET Status = 'Completed',
                PerformedBy = @PerformedBy,
                PerformedDate = @PerformedDate,
                Notes = ISNULL(@Notes, Notes)
            WHERE SuturingID = @ProcedureID;
        END
        ELSE IF @ProcedureType = 'EarIrrigation'
        BEGIN
            UPDATE CHMS.EarIrrigation
            SET Status = 'Completed',
                PerformedBy = @PerformedBy,
                PerformedDate = @PerformedDate,
                Notes = ISNULL(@Notes, Notes)
            WHERE EarIrrigationID = @ProcedureID;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Get Today's Pending Procedures
CREATE PROCEDURE [CHMS].[sp_GetTodayPendingProcedures]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get today's pending wound care procedures
    SELECT 
        'WoundCare' AS ProcedureType,
        w.WoundCareID AS ProcedureID,
        w.WoundCareNumber AS ProcedureNumber,
        w.ProcedureDate,
        w.Status,
        w.PatientID, p.CardNumber, p.FirstName + ' ' + p.LastName AS PatientName,
        w.WoundType, w.WoundLocation, w.TreatmentPlan
    FROM CHMS.WoundCare w
    INNER JOIN CHMS.Patients p ON w.PatientID = p.PatientID
    WHERE CAST(w.ProcedureDate AS DATE) = CAST(GETDATE() AS DATE)
        AND w.Status = 'Pending'
    
    UNION ALL
    
    -- Get today's pending suturing procedures
    SELECT 
        'Suturing' AS ProcedureType,
        s.SuturingID AS ProcedureID,
        s.SuturingNumber AS ProcedureNumber,
        s.ProcedureDate,
        s.Status,
        s.PatientID, p.CardNumber, p.FirstName + ' ' + p.LastName AS PatientName,
        s.WoundType, s.WoundLocation, s.SutureType
    FROM CHMS.Suturing s
    INNER JOIN CHMS.Patients p ON s.PatientID = p.PatientID
    WHERE CAST(s.ProcedureDate AS DATE) = CAST(GETDATE() AS DATE)
        AND s.Status = 'Pending'
    
    UNION ALL
    
    -- Get today's pending ear irrigation procedures
    SELECT 
        'EarIrrigation' AS ProcedureType,
        e.EarIrrigationID AS ProcedureID,
        e.EarIrrigationNumber AS ProcedureNumber,
        e.ProcedureDate,
        e.Status,
        e.PatientID, p.CardNumber, p.FirstName + ' ' + p.LastName AS PatientName,
        e.EarSide, e.IrrigationSolution, e.SolutionTemperature
    FROM CHMS.EarIrrigation e
    INNER JOIN CHMS.Patients p ON e.PatientID = p.PatientID
    WHERE CAST(e.ProcedureDate AS DATE) = CAST(GETDATE() AS DATE)
        AND e.Status = 'Pending'
    
    ORDER BY ProcedureDate;
END
GO
