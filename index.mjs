import {CleanRoomsClient, StartProtectedQueryCommand} from "@aws-sdk/client-cleanrooms";

const client = new CleanRoomsClient();

const input = {
    type: "SQL",
    membershipIdentifier: process.env.MEMBERSHIP_ID,
    sqlParameters: {
        analysisTemplateArn: process.env.ANALYSIS_TEMPLATE_ARN,
        parameters: JSON.parse(process.env.PARAMETERS)
    },
    resultConfiguration: {
        outputConfiguration: {
            s3: {
                resultFormat: "CSV",
                bucket: process.env.RESULT_OUTPUT_S3_BUCKET,
                keyPrefix: process.env.RESULT_OUTPUT_S3_KEY_PREFIX,
            },
        },
    },
};

export const handler = async (event) => {
    const command = new StartProtectedQueryCommand(input);
    const response = await client.send(command);
}
