import { ethers } from 'ethers';
import type { EventsType } from '../types/campaing';


export function handlerBlockchainLogs(events: EventsType) {
    return events
        .filter(event => event instanceof ethers.EventLog)
        .map(event => ({ 
            args: event.args, 
            event: event.eventName, 
            block: event.blockNumber, 
            transaction: event.transactionIndex 
        }))
}

