import { Device } from 'mediasoup-client';
import { RtpCapabilities, RtpParameters } from 'mediasoup-client/lib/RtpParameters';
import { Transport } from 'mediasoup-client/lib/Transport';
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { consumeMedia } from '../utils/consumer';
import { produceMedia } from '../utils/producer';
import { connectTransport, createTransport } from '../utils/transport';

export default function CallManager({ socket }: { socket: Socket; }) {
    const [canCall, setCanCall] = useState<boolean>(false);

    const [device, setDevice] = useState<Device>(new Device());

    const [connectionState, setConnectionState] = useState<string>('not connected');

    const [transport, setTransport] = useState<Transport>(null);
    const [producerId, setProduceId] = useState<string>('');
    const [rtpParameters, setRtpParameters] = useState<RtpParameters>(null);

    const videoSendRef = useRef<HTMLVideoElement>();
    const videoRecvRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        socket.emit('routerRtpCapabilities', async (routerRtpCapabilities: RtpCapabilities) => {
            const device = await createDevice({ routerRtpCapabilities });
            setDevice(device);

            if (!device.canProduce('video')) {
                setCanCall(false);
                return console.error('Le navigateur n\'est pas en mesure de produire un flux audio')
            } else {
                setCanCall(true);
            }
        });
    }, [socket]);

    async function call() {
        try {
            const transport = await createTransport({ device, socket, direction: 'send' });

            transport.on('connectionstatechange', (connectionState) => setConnectionState(connectionState));
            transport.on('icestatechange', (iceState) => console.log('[Transport]', 'send ICE state changed :', iceState));

            transport.once('connect', async ({ dtlsParameters }, callback, errback) => {
                console.log('[Transport]', 'Connexion au serveur en cours');
                connectTransport({ dtlsParameters, socket, direction: 'send' })
                    .then(() => {
                        console.log('[Transport]', 'Connecté au serveur');
                        callback();
                    })
                    .catch(errback);
            });
            transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
                console.log('[Transport]', 'Procuce media - Échange des données rtp capabilities');
                setRtpParameters(rtpParameters);

                const produceMediaOptions = {
                    socket,
                    rtpParameters,
                    clientRtpCapabilities: device.rtpCapabilities,
                    kind
                }
                produceMedia(produceMediaOptions)
                    .then((produceId) => {
                        console.log('[Transport]', 'Produce success', produceId);
                        setProduceId(produceId);
                        callback({ id: produceId });
                    })
                    .catch(errback);
            });
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 1920,
                    height: 1080
                },
                audio: false
            });
            const videoTrack = stream.getVideoTracks()[0];
            videoSendRef.current.srcObject = stream;
            videoSendRef.current.play();

            const producer = await transport.produce({ track: videoTrack });
            setProduceId(producer.id);
        } catch (error) {
            console.error(error);
        }
    }

    async function receiveCall() {
        try {
            const transport = await createTransport({ device, socket, direction: 'recv' });

            transport.on('connectionstatechange', (connectionState) => setConnectionState(connectionState));
            transport.on('icestatechange', (iceState) => console.log('[Transport]', 'recv ICE state changed :', iceState));

            transport.once('connect', async ({ dtlsParameters }, callback, errback) => {
                console.log('[Transport]', 'Connexion au serveur en cours');
                connectTransport({ dtlsParameters, socket, direction: 'recv' })
                    .then(() => {
                        console.log('[Transport]', 'Connecté au serveur');
                        callback();
                    })
                    .catch(errback);
            });

            console.log('[Transport]', 'Consume media - Échange des données rtp capabilities');
            const consumerId = await consumeMedia({ socket, clientRtpCapabilities: device?.rtpCapabilities, producerId });
            const consumer = await transport.consume({ id: consumerId, producerId, rtpParameters, kind: 'video' });
            console.log('[Transport]', 'Consume success', consumer);

            const stream = new MediaStream([consumer.track]);
            videoRecvRef.current.srcObject = stream;
            videoRecvRef.current.play();
        } catch (error) {
            console.error(error);
        }
    }

    if (!canCall) {
        return (<>
            cant make call
        </>);
    }

    return (<>
        <button onClick={call}>call</button>
        <button onClick={receiveCall}>receive call</button>
        <div className='videos' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {connectionState}
            <div>
                <p>send</p>
                <video controls ref={videoSendRef} width={364} />
            </div>
            <div>
                <p>recv</p>
                <video controls ref={videoRecvRef} width={364} />
            </div>
        </div>
    </>);
}

async function createDevice({ routerRtpCapabilities }: { routerRtpCapabilities: RtpCapabilities; }) {
    const device = new Device();
    await device.load({ routerRtpCapabilities });
    return device
}