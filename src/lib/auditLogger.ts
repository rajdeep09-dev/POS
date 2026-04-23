import { db, AuditLog } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const logAuditEvent = async (
  tenant_id: string,
  user_id: string,
  action: 'MANUAL_DISCOUNT' | 'DELETE_SALE' | 'OPEN_SHIFT' | 'CLOSE_SHIFT' | 'RETURN_ITEM',
  entity_type: 'sale' | 'shift' | 'sale_item',
  entity_id: string,
  details: any
) => {
  try {
    const log: AuditLog = {
      id: uuidv4(),
      tenant_id,
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
      sync_status: 'pending'
    };
    
    await db.audit_logs.add(log);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
