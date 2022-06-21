import { useEffect, useRef, useState } from 'react';

import { Device } from 'mediasoup-client';
import { RtpCapabilities, Transport } from 'mediasoup-client/lib/types';

import io from 'socket.io-client';

import Stats from '../components/stats';

import { connectTransport, createTransport } from '../utils/transport';
import { consumeMedia } from '../utils/producer';

import styles from '../styles/stream-view.module.scss';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function Viewer({ routerRtpCapabilities, userId }: { routerRtpCapabilities: RtpCapabilities; userId: string; }) {
	const [unsupported, setUnsupported] = useState<boolean>(false);
	const [device, setDevice] = useState<Device>();
	const [connectionState, setConnectionState] = useState<string>('non connecté');

	const [transport, setTransport] = useState<Transport>(null);
	const [producerId, setProducerId] = useState<string>('');
	const [rtpParameters, setRtpParameters] = useState<any>('');

	const videoRef = useRef<HTMLVideoElement>();

	useEffect(() => {
		async function init() {
			const socket = io(process.env.NEXT_PUBLIC_API_URL);
			socket.on('yes', () => console.log('yes'));

			try {
				console.log('[Transport]', 'Initialisation');

				const device = new Device();
				await device.load({ routerRtpCapabilities });
				setDevice(device);

				console.log('[Transport]', 'Création du transport');
				const transport = await createTransport({ userId, device, type: 'recv' });

				transport.on('connectionstatechange', (connectionState) => {
					console.log('[Transport]', 'Statut connexion :', connectionState);
					setConnectionState(connectionState);
				});
				transport.once('connect', async ({ dtlsParameters }, callback, errback) => {
					console.log('[Transport]', 'Connexion au serveur en cours');
					connectTransport({ userId, dtlsParameters, type: 'recv' })
						.then(() => {
							console.log('[Transport]', 'Connecté au serveur');
							callback();
						})
						.catch(errback);
				});
				transport.on('icestatechange', (iceState) => console.log('[Transport]', 'ICE state changed :', iceState));

				setTransport(transport);
			} catch (error) {
				console.error('[Transport]', 'Browser incompatible', error);
				setUnsupported(true);
			}
		}
		init();
	}, [routerRtpCapabilities, userId]);

	async function start() {
		if (!transport) return console.warn('[Transport]', 'Non disponible pour le moment');

		console.log('[Transport]', 'Consume media - Échange des données rtp capabilities');
		const data = await consumeMedia({ userId, clientRtpCapabilities: device?.rtpCapabilities, producerId });

		try {
			const consumer = await transport.consume({ id: data.consumerId, producerId, rtpParameters: JSON.parse(rtpParameters), kind: 'video' });
			console.log('[Transport]', 'Consume success', consumer);

			const stream = new MediaStream([consumer.track]);
			videoRef.current.srcObject = stream;
			videoRef.current.play();
		} catch (error) {
			console.error('[Transport]', 'Error', error);
		}
	}

	if (!routerRtpCapabilities) {
		return (<>
			<div className={styles['App']}>
				routerRtpCapabilities missing
			</div>
		</>);
	}

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
						value={producerId}
						onChange={({ target }) => setProducerId(target.value)}
					/>
				</div>
				<div className='input-field'>
					<label htmlFor='textarea-rtp-parameters'>
						RTP Params:
					</label>
					<textarea
						id='textarea-rtp-parameters'
						value={rtpParameters}
						onChange={({ target }) => setRtpParameters(target.value)}
					/>
				</div>
			</div>
			<div className={styles['field']}>
				<button onClick={start}>
					consume
				</button>
			</div>
			<div className={styles['field']}>
				{transport && (<Stats transport={transport} />)}
			</div>
		</div>
	</>)
}

export async function getServerSideProps() {
	try {
		const response = await fetch(`${API_URL}/routerRtpCapabilities`);
		const { routerRtpCapabilities, id } = await response.json();

		return {
			props: {
				routerRtpCapabilities,
				userId: id
			}
		}
	} catch (error) {
		console.error(error);
		return {
			props: {}
		}
	}
}

Viewer.authRequired = true;
export default Viewer;