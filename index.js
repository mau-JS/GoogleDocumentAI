const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const fs = require('fs');

/**
 * Runs the sample document through Document AI to get key/value pairs and
 * confidence scores.
 */
/**
 * Extract form data and confidence from processed document.
 */
function extractFormData(document) {
    // Extract shards from the text field
    function getText(textAnchor, document) {
        if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
            return '';
        }

        // First shard in document doesn't have startIndex property
        const startIndex = textAnchor.textSegments[0].startIndex || 0;
        const endIndex = textAnchor.textSegments[0].endIndex;

        return document.text.substring(startIndex, endIndex);
    }

    var formData = [];

    const pages = document.pages;

    pages.forEach((page) => {
        const formFields = page.formFields;
        formFields.forEach((field) => {
            // Get the extracted field names and remove extra space from text
            const fieldName = getText(field.fieldName.textAnchor, document);
            // Confidence - How "sure" the API is that the text is correct
            const nameConfidence = field.fieldName.confidence.toFixed(4);

            const fieldValue = getText(field.fieldValue.textAnchor, document);
            const valueConfidence = field.fieldValue.confidence.toFixed(4);

            formData.push({
                fieldName: fieldName,
                fieldValue: fieldValue,
                nameConfidence: nameConfidence,
                valueConfidence: valueConfidence
            });
        });
    });

    return formData;
}
async function processDocument(projectId, location, processorId, filePath, mimeType) {
    // Instantiates a client
    const documentaiClient = new DocumentProcessorServiceClient();

    // The full resource name of the processor, e.g.:
    // projects/project-id/locations/location/processor/processor-id
    // You must create new processors in the Cloud Console first
    const resourceName = documentaiClient.processorPath(projectId, location, processorId);

    // Read the file into memory.
    const imageFile = fs.readFileSync(filePath);

    // Convert the image data to a Buffer and base64 encode it.
    const encodedImage = Buffer.from(imageFile).toString('base64');

    // Load Binary Data into Document AI RawDocument Object
    const rawDocument = {
        content: encodedImage,
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

/**
 * Run the codelab.
 */
async function main() {
    const projectId = 'documentprincipal';
    const location = 'us'; // Format is 'us' or 'eu'
    const processorId = '3f7983dcf3c6d6c6'; // Should be a Hexadecimal string

    // Supported File Types
    // https://cloud.google.com/document-ai/docs/processors-list#processor_form-parser
    filePath = 'ConstanciaFiscalOECG.pdf'; // The local file in your current working directory
    mimeType = 'application/pdf';

    const document = await processDocument(projectId, location, processorId, filePath, mimeType);
    console.log("Document Processing Complete");

    // Print the document text as one big string
    console.log(`Text: ${document.text}`);
}

main(...process.argv.slice(2)).catch(err => {
    console.error(err);
    process.exitCode = 1;
});