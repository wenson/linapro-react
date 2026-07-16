-- Remove TapCanvas project and chapter resources in reverse dependency order.

DELETE FROM sys_dict_data WHERE "dict_type" = 'tapcanvas_chapter_status';
DELETE FROM sys_dict_type WHERE "type" = 'tapcanvas_chapter_status';

DROP TABLE IF EXISTS tapcanvas_chapters;
DROP TABLE IF EXISTS tapcanvas_projects;
