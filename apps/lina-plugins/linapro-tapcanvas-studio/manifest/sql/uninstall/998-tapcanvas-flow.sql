-- Remove TapCanvas Flow resources in reverse dependency order.

DELETE FROM sys_dict_data WHERE "dict_type" IN ('tapcanvas_flow_actor_type', 'tapcanvas_flow_owner_type');
DELETE FROM sys_dict_type WHERE "type" IN ('tapcanvas_flow_actor_type', 'tapcanvas_flow_owner_type');

DROP TABLE IF EXISTS tapcanvas_flow_versions;
DROP TABLE IF EXISTS tapcanvas_flow_mutations;
DROP TABLE IF EXISTS tapcanvas_flows;
