/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { DataModelFromSchemaDefinition } from "convex/server";
import type schema from "../schema.js";

/**
 * The names of all of your Convex tables.
 */
export type TableNames = "listings" | "listing_changes" | "contacts" | "settings" | "user_emails";

/**
 * The type of a document stored in Convex.
 */
export type Doc<TableName extends TableNames> =
  DataModelFromSchemaDefinition<typeof schema>[TableName]["document"];

/**
 * An identifier for a document in Convex.
 */
export type Id<TableName extends TableNames> =
  DataModelFromSchemaDefinition<typeof schema>[TableName]["document"]["_id"];

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
