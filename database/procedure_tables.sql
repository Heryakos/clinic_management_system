-- Procedure Room Database Tables
-- Wound Care Table
USE [xokaERP]
GO

CREATE TABLE [CHMS].[WoundCare](
    [WoundCareID] [int] IDENTITY(1,1) NOT NULL,
    [WoundCareNumber] [nvarchar](50) NOT NULL,
    [PatientID] [int] NOT NULL,
    [CardNumber] [nvarchar](50) NOT NULL,
    [OrderingPhysicianID] [uniqueidentifier] NOT NULL,
    [WoundType] [nvarchar](100) NOT NULL,
    [WoundLocation] [nvarchar](200) NOT NULL,
    [WoundSize] [nvarchar](50) NOT NULL,
    [WoundDepth] [nvarchar](50) NOT NULL,
    [WoundCondition] [nvarchar](200) NOT NULL,
    [TreatmentPlan] [nvarchar](500) NOT NULL,
    [DressingType] [nvarchar](100) NOT NULL,
    [CleaningSolution] [nvarchar](100) NOT NULL,
    [Instructions] [nvarchar](500) NULL,
    [Notes] [nvarchar](500) NULL,
    [ProcedureDate] [datetime] NOT NULL,
    [Status] [nvarchar](50) NOT NULL,
    [PerformedBy] [uniqueidentifier] NULL,
    [PerformedDate] [datetime] NULL,
    [CreatedBy] [uniqueidentifier] NOT NULL,
    [CreatedDate] [datetime] NOT NULL,
    [ModifiedBy] [uniqueidentifier] NULL,
    [ModifiedDate] [datetime] NULL,
    [IsRecurring] [bit] NOT NULL,
    [Frequency] [nvarchar](50) NULL,
    [TotalSessions] [int] NULL,
    [CompletedSessions] [int] NULL,
    CONSTRAINT [PK_WoundCare] PRIMARY KEY CLUSTERED ([WoundCareID] ASC),
    CONSTRAINT [UQ_WoundCare_Number] UNIQUE ([WoundCareNumber]),
    CONSTRAINT [FK_WoundCare_Patient] FOREIGN KEY ([PatientID]) REFERENCES [CHMS].[Patients] ([PatientID]),
    CONSTRAINT [FK_WoundCare_Physician] FOREIGN KEY ([OrderingPhysicianID]) REFERENCES [dbo].[aspnet_Users] ([UserId]),
    CONSTRAINT [FK_WoundCare_PerformedBy] FOREIGN KEY ([PerformedBy]) REFERENCES [dbo].[aspnet_Users] ([UserId]),
    CONSTRAINT [FK_WoundCare_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[aspnet_Users] ([UserId])
) ON [PRIMARY]
GO

-- Suturing Table
CREATE TABLE [CHMS].[Suturing](
    [SuturingID] [int] IDENTITY(1,1) NOT NULL,
    [SuturingNumber] [nvarchar](50) NOT NULL,
    [PatientID] [int] NOT NULL,
    [CardNumber] [nvarchar](50) NOT NULL,
    [OrderingPhysicianID] [uniqueidentifier] NOT NULL,
    [WoundType] [nvarchar](100) NOT NULL,
    [WoundLocation] [nvarchar](200) NOT NULL,
    [WoundSize] [nvarchar](50) NOT NULL,
    [WoundDepth] [nvarchar](50) NOT NULL,
    [SutureType] [nvarchar](100) NOT NULL,
    [SutureMaterial] [nvarchar](100) NOT NULL,
    [SutureSize] [nvarchar](50) NOT NULL,
    [NumStitches] [int] NOT NULL,
    [AnesthesiaUsed] [nvarchar](100) NULL,
    [Instructions] [nvarchar](500) NULL,
    [Notes] [nvarchar](500) NULL,
    [ProcedureDate] [datetime] NOT NULL,
    [Status] [nvarchar](50) NOT NULL,
    [PerformedBy] [uniqueidentifier] NULL,
    [PerformedDate] [datetime] NULL,
    [CreatedBy] [uniqueidentifier] NOT NULL,
    [CreatedDate] [datetime] NOT NULL,
    [ModifiedBy] [uniqueidentifier] NULL,
    [ModifiedDate] [datetime] NULL,
    [FollowUpRequired] [bit] NOT NULL,
    [FollowUpDate] [datetime] NULL,
    [RemovalDate] [datetime] NULL,
    CONSTRAINT [PK_Suturing] PRIMARY KEY CLUSTERED ([SuturingID] ASC),
    CONSTRAINT [UQ_Suturing_Number] UNIQUE ([SuturingNumber]),
    CONSTRAINT [FK_Suturing_Patient] FOREIGN KEY ([PatientID]) REFERENCES [CHMS].[Patients] ([PatientID]),
    CONSTRAINT [FK_Suturing_Physician] FOREIGN KEY ([OrderingPhysicianID]) REFERENCES [dbo].[aspnet_Users] ([UserId]),
    CONSTRAINT [FK_Suturing_PerformedBy] FOREIGN KEY ([PerformedBy]) REFERENCES [dbo].[aspnet_Users] ([UserId]),
    CONSTRAINT [FK_Suturing_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[aspnet_Users] ([UserId])
) ON [PRIMARY]
GO

-- Ear Irrigation Table
CREATE TABLE [CHMS].[EarIrrigation](
    [EarIrrigationID] [int] IDENTITY(1,1) NOT NULL,
    [EarIrrigationNumber] [nvarchar](50) NOT NULL,
    [PatientID] [int] NOT NULL,
    [CardNumber] [nvarchar](50) NOT NULL,
    [OrderingPhysicianID] [uniqueidentifier] NOT NULL,
    [EarSide] [nvarchar](10) NOT NULL,
    [IrrigationSolution] [nvarchar](100) NOT NULL,
    [SolutionTemperature] [nvarchar](50) NOT NULL,
    [IrrigationPressure] [nvarchar](50) NOT NULL,
    [ProcedureDuration] [int] NOT NULL,
    [Findings] [nvarchar](500) NULL,
    [Complications] [nvarchar](500) NULL,
    [Instructions] [nvarchar](500) NULL,
    [Notes] [nvarchar](500) NULL,
    [ProcedureDate] [datetime] NOT NULL,
    [Status] [nvarchar](50) NOT NULL,
    [PerformedBy] [uniqueidentifier] NULL,
    [PerformedDate] [datetime] NULL,
    [CreatedBy] [uniqueidentifier] NOT NULL,
    [CreatedDate] [datetime] NOT NULL,
    [ModifiedBy] [uniqueidentifier] NULL,
    [ModifiedDate] [datetime] NULL,
    [FollowUpRequired] [bit] NOT NULL,
    [FollowUpDate] [datetime] NULL,
    CONSTRAINT [PK_EarIrrigation] PRIMARY KEY CLUSTERED ([EarIrrigationID] ASC),
    CONSTRAINT [UQ_EarIrrigation_Number] UNIQUE ([EarIrrigationNumber]),
    CONSTRAINT [FK_EarIrrigation_Patient] FOREIGN KEY ([PatientID]) REFERENCES [CHMS].[Patients] ([PatientID]),
    CONSTRAINT [FK_EarIrrigation_Physician] FOREIGN KEY ([OrderingPhysicianID]) REFERENCES [dbo].[aspnet_Users] ([UserId]),
    CONSTRAINT [FK_EarIrrigation_PerformedBy] FOREIGN KEY ([PerformedBy]) REFERENCES [dbo].[aspnet_Users] ([UserId]),
    CONSTRAINT [FK_EarIrrigation_CreatedBy] FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[aspnet_Users] ([UserId])
) ON [PRIMARY]
GO

-- Procedure Schedules Table (for recurring procedures)
CREATE TABLE [CHMS].[ProcedureSchedules](
    [ScheduleID] [int] IDENTITY(1,1) NOT NULL,
    [ProcedureID] [int] NOT NULL,
    [ProcedureType] [nvarchar](50) NOT NULL,
    [ScheduledDate] [datetime] NOT NULL,
    [ScheduledTime] [varchar](5) NULL,
    [Status] [nvarchar](20) NOT NULL,
    [PerformedBy] [uniqueidentifier] NULL,
    [PerformedDate] [datetime] NULL,
    [Notes] [nvarchar](max) NULL,
    [CreatedDate] [datetime] NOT NULL,
    CONSTRAINT [PK_ProcedureSchedules] PRIMARY KEY CLUSTERED ([ScheduleID] ASC),
    CONSTRAINT [FK_ProcedureSchedules_Procedure] FOREIGN KEY ([ProcedureID]) REFERENCES [CHMS].[WoundCare] ([WoundCareID]) -- This will need to be updated based on procedure type
) ON [PRIMARY]
GO

-- Add default constraints
ALTER TABLE [CHMS].[WoundCare] ADD CONSTRAINT [DF_WoundCare_Status] DEFAULT ('Pending') FOR [Status]
ALTER TABLE [CHMS].[WoundCare] ADD CONSTRAINT [DF_WoundCare_CreatedDate] DEFAULT (getdate()) FOR [CreatedDate]
ALTER TABLE [CHMS].[WoundCare] ADD CONSTRAINT [DF_WoundCare_IsRecurring] DEFAULT ((0)) FOR [IsRecurring]
ALTER TABLE [CHMS].[WoundCare] ADD CONSTRAINT [DF_WoundCare_CompletedSessions] DEFAULT ((0)) FOR [CompletedSessions]

ALTER TABLE [CHMS].[Suturing] ADD CONSTRAINT [DF_Suturing_Status] DEFAULT ('Pending') FOR [Status]
ALTER TABLE [CHMS].[Suturing] ADD CONSTRAINT [DF_Suturing_CreatedDate] DEFAULT (getdate()) FOR [CreatedDate]
ALTER TABLE [CHMS].[Suturing] ADD CONSTRAINT [DF_Suturing_FollowUpRequired] DEFAULT ((0)) FOR [FollowUpRequired]

ALTER TABLE [CHMS].[EarIrrigation] ADD CONSTRAINT [DF_EarIrrigation_Status] DEFAULT ('Pending') FOR [Status]
ALTER TABLE [CHMS].[EarIrrigation] ADD CONSTRAINT [DF_EarIrrigation_CreatedDate] DEFAULT (getdate()) FOR [CreatedDate]
ALTER TABLE [CHMS].[EarIrrigation] ADD CONSTRAINT [DF_EarIrrigation_FollowUpRequired] DEFAULT ((0)) FOR [FollowUpRequired]

ALTER TABLE [CHMS].[ProcedureSchedules] ADD CONSTRAINT [DF_ProcedureSchedules_Status] DEFAULT ('Pending') FOR [Status]
ALTER TABLE [CHMS].[ProcedureSchedules] ADD CONSTRAINT [DF_ProcedureSchedules_CreatedDate] DEFAULT (getdate()) FOR [CreatedDate]
GO
