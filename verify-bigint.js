try {
    const result = {
        id: "cmle4p9ve0023v57scom1wf9p",
        fileSize: BigInt(561212),
        createdAt: new Date(),
    };

    // This mimics what's happening in route.ts:
    // const res = { ...result, fileSize: result.fileSize.toString() }
    const res = {
        ...result,
        fileSize: result.fileSize.toString()
    };

    console.log("Object after spread and override:", res);
    console.log("Type of fileSize:", typeof res.fileSize);

    const serialized = JSON.stringify(res);
    console.log("Serialized successfully:", serialized);

} catch (error) {
    console.error("Serialization FAILED:", error);
}

// Test case 2: If there's ANOTHER BigInt
try {
    const result2 = {
        id: "test",
        fileSize: BigInt(561212),
        otherBigInt: BigInt(123)
    };

    const res2 = {
        ...result2,
        fileSize: result2.fileSize.toString()
    };

    console.log("\nObject with extra BigInt after override:", res2);
    JSON.stringify(res2);
} catch (error) {
    console.log("Serialization of object with extra BigInt FAILED as expected:", error.message);
}
