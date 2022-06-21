import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

import { Device } from 'mediasoup-client';
import { RtpCapabilities, Transport } from 'mediasoup-client/lib/types';

import io, { Socket } from 'socket.io-client';

import Stats from '../components/stats';

import { connectTransport, createTransport } from '../utils/transport';
import { produceMedia } from '../utils/consumer';

import styles from '../styles/stream-view.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function StreamPage({ socket }: { socket: Socket; }) {
    const [unsupported, setUnsupported] = useState<boolean>(false);
    const [device, setDevice] = useState<Device>();
    const [connectionState, setConnectionState] = useState<string>('not connected');

    const [transport, setTransport] = useState<Transport>(null);
    const [produceId, setProduceId] = useState<string>('');
    const [rtpParameters, setRtpParameters] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement>();

    // const transportInitialisation = useCallback(async () => {
    //     try {

    //         const device = new Device();
    //         setDevice(device);

    //         await device.load({ routerRtpCapabilities });

    //         if (!device.canProduce('video')) {
    //             return console.warn('[Transport]', 'Error, device non compatible');
    //         }

    //         const transport = await createTransport({ userId, device, type: 'send' });
    //         setTransport(transport);

    //         transport.on('connectionstatechange', (connectionState) => setConnectionState(connectionState));
    //         transport.once('connect', async ({ dtlsParameters }, callback, errback) => {
    //             console.log('[Transport]', 'Connexion au serveur en cours');
    //             connectTransport({ userId, dtlsParameters, type: 'send' })
    //                 .then(() => {
    //                     console.log('[Transport]', 'Connecté au serveur');
    //                     callback();
    //                 })
    //                 .catch(errback);
    //         });
    //         transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
    //             console.log('[Transport]', 'Procuce media - Échange des données rtp capabilities');
    //             setRtpParameters(JSON.stringify(rtpParameters));

    //             const produceMediaOptions = {
    //                 userId,
    //                 rtpParameters,
    //                 clientRtpCapabilities: device?.rtpCapabilities,
    //                 kind
    //             }
    //             produceMedia(produceMediaOptions)
    //                 .then(({ id }) => {
    //                     console.log('[Transport]', 'Produce success');
    //                     setProduceId(id);
    //                     callback({ id });
    //                 })
    //                 .catch(errback);
    //         });
    //         transport.on('icestatechange', (iceState) => console.log('[Transport]', 'ICE state changed :', iceState));

    //         const stream = await navigator.mediaDevices.getUserMedia({
    //             video: {
    //                 width: 1920,
    //                 height: 1080
    //             },
    //             audio: true
    //         });
    //         const videoTrack = stream.getVideoTracks()[0];
    //         videoRef.current.srcObject = stream;
    //         videoRef.current.play();

    //         const producer = await transport.produce({
    //             track: videoTrack,
    //             encodings: [
    //                 { maxBitrate: 100000 },
    //                 { maxBitrate: 300000 },
    //                 { maxBitrate: 900000 }
    //             ],
    //             codecOptions: {
    //                 videoGoogleStartBitrate: 1000
    //             }
    //         });

    //         console.log('client producer id', producer.id);
    //         console.log('client producer rtpParameters', producer.rtpParameters);
    //     } catch (error: any) {
    //         console.error(error);
    //         if (error.name === 'UnsupportedError') {
    //             console.warn('browser not supported');
    //             setUnsupported(true);
    //         }
    //     }
    // }, [routerRtpCapabilities, userId]);

    // useEffect(() => {
    //     const socket = io(process.env.NEXT_PUBLIC_API_URL);
    //     socket.on('connect', async () => {
    //         console.log('[Socket]', 'Connecté au serveur de socket');
    //         setSocket(socket);

    //         transportInitialisation();
    //     });
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

    // if (!routerRtpCapabilities) {
    //     return (<>
    //         <div className={styles['App']}>
    //             routerRtpCapabilities missing
    //         </div>
    //     </>);
    // }

    if (!device?.loaded) {
        return (<>
            <div className={styles['App']}>
                Chargement du device en cours
            </div>
        </>);
    }

    if (unsupported) {
        return (<>
            <div className={styles['App']}>
                Device non compatible
            </div>
        </>);
    }

    return (<>
        <div className={styles['App']}>
            <div className={styles['field']}>
                <video ref={videoRef} controls />
            </div>
            <div className={styles['field']}>
                <p>État de la connexion : <span style={{ background: '#dadce0', padding: '0 7px', borderRadius: '2px' }}>{connectionState}</span></p>
            </div>
            <div className={styles['field']}>
                <div className='input-field'>
                    <label htmlFor='input-produce-id'>
                        Produce ID:
                    </label>
                    <input
                        id='input-produce-id'
                        type='text'
                        value={produceId}
                        readOnly={true}
                    />
                </div>
                <div className='input-field'>
                    <label htmlFor='textarea-rtp-parameters'>
                        RTP Params:
                    </label>
                    <textarea
                        id='textarea-rtp-parameters'
                        value={rtpParameters}
                        readOnly={true}
                    />
                </div>
            </div>
            <div className={styles['field']}>
                {transport && (<Stats transport={transport} />)}
            </div>
        </div>
    </>)
}

StreamPage.authRequired = true;
export default StreamPage;