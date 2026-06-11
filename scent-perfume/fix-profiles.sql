-- ============================================================
-- ДОЛИВКА ПРОФИЛЕЙ — выполнить один раз в Supabase → SQL Editor
--
-- Зачем: скрипт «полной пересборки» удалял таблицу profiles
-- целиком (DROP TABLE ... CASCADE), а триггер on_auth_user_created
-- создаёт профиль только при НОВОЙ регистрации. У всех, кто
-- зарегистрировался ДО пересборки, строки профиля нет — поэтому
-- сохранение данных в кабинете обновляло «ноль строк».
--
-- Код сайта теперь делает UPSERT и сам создаст строку при первом
-- сохранении. Этот скрипт просто сразу наводит порядок для всех
-- существующих пользователей.
-- ============================================================

INSERT INTO public.profiles (id, full_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Проверка: цифры должны совпасть
SELECT
  (SELECT COUNT(*) FROM auth.users)      AS users_total,
  (SELECT COUNT(*) FROM public.profiles) AS profiles_total;
