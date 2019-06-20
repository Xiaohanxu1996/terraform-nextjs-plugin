const { getGatewayKey, getLambdaPrefix } = require("../configuration");

/** @typedef {import('../index').AWS.GatewayIntegration} GatewayIntegration */
/** @typedef {import('../declarations').Param} Param */

/** @typedef {{ uniqueId: string; resource: GatewayIntegration }} ReturnResult */
/**
 * It generates the integration resource
 *
 * @param {object} options
 * @param {string} options.id
 * @param {string} options.gatewayResourceId
 * @param {string} options.lambdaName
 * @param {Param[]} options.params
 * @param {Param[]} options.queryStringParams
 * @returns {ReturnResult}
 */
function generateGatewayIntegration({ id, gatewayResourceId, lambdaName, params = [], queryStringParams = [] }) {
	return {
		uniqueId: `${getGatewayKey()}-${id}`,
		resource: _generateResource(gatewayResourceId, lambdaName, params, queryStringParams)
	};
}

/**
 *
 *
 * @param {string} gatewayResourceId
 * @param {string} lambdaName
 * @param {Param[]} params
 * @param {Param[]} queryStringParams
 * @returns {GatewayIntegration}
 */
function _generateResource(gatewayResourceId, lambdaName, params, queryStringParams) {
	const resource = {
		rest_api_id: "${aws_api_gateway_rest_api." + getGatewayKey() + ".id}",
		resource_id: "${aws_api_gateway_resource." + gatewayResourceId + ".id}",
		http_method: "GET",
		integration_http_method: "POST",
		type: "AWS_PROXY",
		uri:
			"arn:aws:apigateway:${local.aws_region}:lambda:path/2015-03-31/functions/${aws_lambda_function." +
			getLambdaPrefix() +
			"-" +
			lambdaName +
			".arn}/invocations"
	};

	if (params.length > 0) {
		resource.request_parameters = params.reduce((result, param) => {
			result[`integration.request.path.${param.name}`] = `method.request.path.${param.name}`;

			return result;
		}, resource.request_parameters || {});
	}

	if (queryStringParams.length > 0) {
		resource.request_parameters = queryStringParams.reduce((result, param) => {
			result[`integration.request.querystring.${param.name}`] = `method.request.querystring.${param.name}`;

			return result;
		}, resource.request_parameters || {});
	}

	return resource;
}

module.exports = { generateGatewayIntegration };
