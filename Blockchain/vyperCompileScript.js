echo "{\"contractName\":\"CurveFunctions\",\"abi\":$(vyper -f abi contracts/_curveIntegrals/v1/CurveFunctions.vy),\"bytecode\":\"$(vyper -f bytecode contracts/_curveIntegrals/v1/CurveFunctions.vy)\",\"method_identifiers\":\"$(vyper -f method_identifiers contracts/_curveIntegrals/v1/CurveFunctions.vy)\",\"bytecode_runtime\":\"$(vyper -f bytecode_runtime contracts/_curveIntegrals/v1/CurveFunctions.vy)\"}" > "build/CurveFunctions.json"