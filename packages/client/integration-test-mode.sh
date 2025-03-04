#!/bin/bash

export NODE_ENV=development
export USE_AUTH0_API=true
export BACKEND_URL=http://localhost:3030
export AUTH0_CLIENT_ID=6FdtIeLNLBCfKWNuZDaPVOfWqU2ARxaV
export INTEGRATION_TEST_MODE=true

expo start --ios
