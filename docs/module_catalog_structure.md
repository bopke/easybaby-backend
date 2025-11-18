# Module catalog structure

This document outlines the standardized catalog structure for modules.

## Standard catalog structure

Each module have to follow this standardized catalog structure:

```
src/
├── [resource]/                                   # Main resource folder
│   ├── [resource].module.ts                      # Module configuration
│   ├── controllers/                              # Controller layer
│   │   ├── [resource].controller.ts              # Root controller
│   │   └── [resource].controller.spec.ts         # Controller tests
│   ├── dtos/                                     # Data Transfer Objects
│   │   ├── [resource]_create.dto.ts
│   │   ├── [resource]_update.dto.ts              # PartialType of create DTO
│   │   ├── [resource]_response.dto.ts
│   │   ├── [resource]_request.dto.ts
│   │   └── index.ts                              # Export all DTOs
│   ├── entities/                                 # Database entities
│   │   ├── [resource].entity.ts                  # Main entity
│   │   ├── [resource]_[related].entity.ts        # Related entities
│   │   ├── enums/                                # Enum definitions
│   │   │   ├── [enum_name].enum.ts               # Enum files
│   │   │   └── index.ts                          # Export all enums
│   │   ├── constants/                            # Constants and data
│   │   │   ├── [constant_name].constants.ts      # Constant files
│   │   │   └── index.ts                          # Export all constants
│   ├── utils/                                    # Utilities
│   │   ├── [utility_name].utils.ts               # Utility files
│   │   └── index.ts                              # Export all utilities
│   ├── mocks/                                    # Testing mocks
│   │   ├── [resource].mock.ts                    # Main entity mock
│   │   ├── [resource]_[related].mock.ts          # Related entity mocks
│   │   └── index.ts                              # Export all mocks
│   └── services/                                 # Business logic layer
│       ├── [resource].service.ts                 # Main service
│       ├── [resource]_[specific].service.ts      # Specialized services
│       ├── [resource].service.spec.ts            # Service tests
│       └── [resource]_[specific].service.spec.ts # Specialized service tests
```
