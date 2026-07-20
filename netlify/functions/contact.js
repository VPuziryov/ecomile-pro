exports.handler = async (event) => {

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: "Netlify Function works!"
    })
  };

};