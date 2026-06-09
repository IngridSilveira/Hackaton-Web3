import { create } from 'ipfs-http-client';
import { useState } from 'react';

interface HookProps {
    onProgress: (bytes: number) => void
    onFinish: (cid: string) => void
}

export function useIPFS(props: HookProps) {
    const { onProgress, onFinish } = props;
    const [isUploadding, setIsUploadding] = useState(false);

    const client = create({
        host: import.meta.env.VITE_IPFS_URL,
        port: import.meta.env.VITE_IPFS_PORT,
        protocol: import.meta.env.VITE_IPFS_PROTOCOL,
    });

    const uploadFile = async (file: File) => {
        const result = await client.add(file, { pin: true, progress: onProgress });
        const cid = result.cid.toString();

        return cid;
    }


    const uploadFileIpfs = async (file: File) => {
        setIsUploadding(true);
        const cid = await uploadFile(file);
        setIsUploadding(false);

        if (onFinish)
            onFinish(cid)
    }


    return {
        uploadFileIpfs,
        isUploadding,
    }
}
