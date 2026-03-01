export const handler = async (event) => {
  const request = event.Records[0].cf.request;
  const host = request.headers.host[0].value;

  // Fix error 503 LambdaLimitExceeded
  // Skip redirect for static assets
  if (request.uri.match(/\.(jpg|jpeg|png|gif|webp|css|js|woff|woff2|ttf|svg|ico)$/i)) {
    return request;
  }

  if (!host.startsWith("www.")) {
    const response = {
      status: "301",
      statusDescription: "Moved Permanently",
      headers: {
        location: [
          {
            key: "Location",
            value: `https://www.${host}${request.uri}`,
          },
        ],
      },
    };
    return response;
  }

  return request;
};
