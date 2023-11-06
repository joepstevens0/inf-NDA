//TODO: fix type usage

export const downloadFile = (blobObject: any, fileName: any ) => {
    const link = document.createElement("a");
    const href = window.URL.createObjectURL(blobObject);
    link.href = href;
    link.download = fileName;

    link.click();
    window.URL.revokeObjectURL(href);

    link.remove();
    return true;
};

export const getCompleteFile = (
    receivedArrayBuffers: any[],
    totalBytesArrayBuffers: any,
    fileName: any
  ) => {
    let offset = 0;
  
    const uintArrayBuffer = new Uint8Array(totalBytesArrayBuffers, 0);
  
    receivedArrayBuffers.forEach((arrayBuffer: any) => {
      uintArrayBuffer.set(
        new Uint8Array(arrayBuffer.buffer || arrayBuffer, arrayBuffer.byteOffset),
        offset
      );
      offset += arrayBuffer.byteLength;
    });
  
    const blobObject = new Blob([uintArrayBuffer]);
  
    return downloadFile(blobObject, fileName);
  };

