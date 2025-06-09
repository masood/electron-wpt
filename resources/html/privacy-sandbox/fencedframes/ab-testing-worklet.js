// ab-testing-worklet.js
class SelectURLOperation {
    async run(urls, data) {
        // Read the user's experiment group from Shared Storage
        const experimentGroup = await this.sharedStorage.get(
            "ab-testing-group"
        );

        // Return the group number
        return experimentGroup;
    }
}

// Register the operation
register("ab-testing", SelectURLOperation);
