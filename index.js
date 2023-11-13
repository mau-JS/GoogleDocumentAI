const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const fs = require('fs');

async function processDocument(projectId, location, processorId, filePath) {
    // Instantiates a client
    const documentaiClient = new DocumentProcessorServiceClient();

    // The full resource name of the processor
    const resourceName = documentaiClient.processorPath(projectId, location, processorId);

    // Read the file into memory.
    const imageFile = fs.readFileSync(filePath);

    // Determine the MIME type based on the file extension
    const extension = filePath.split('.').pop();
    let mimeType;
    switch (extension) {
        case 'pdf':
            mimeType = 'application/pdf';
            break;
        case 'png':
            mimeType = 'image/png';
            break;
        case 'jpg':
        case 'jpeg':
            mimeType = 'image/jpeg';
            break;
        case 'tiff':
            mimeType = 'image/tiff';
            break;
        default:
            throw new Error(`Unsupported file extension: ${extension}`);
    }

    // Load Binary Data into Document AI RawDocument Object
    const rawDocument = {
        content: imageFile,
        mimeType: mimeType,
    };

    // Configure ProcessRequest Object
    const request = {
        name: resourceName,
        rawDocument: rawDocument
    };

    // Use the Document AI client to process the sample form
    const [result] = await documentaiClient.processDocument(request);

    return result.document;
}

async function main() {
    const projectId = 'documentprincipal';
    const location = 'us'; // Format is 'us' or 'eu'
    const processorId = '69de61eeb827ed15'; // Should be a Hexadecimal string
    const filePath = '1_updated_ConstanciaFiscalOECG.pdf'; // The local file in your current working directory

    const document = await processDocument(projectId, location, processorId, filePath);
    console.log(document);
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
